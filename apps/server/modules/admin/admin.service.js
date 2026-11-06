/**
 * Servicio de administración y seguridad.
 *
 * Falta implementar:
 *   - modificar precios, descuentos y márgenes
 *
 * A tener en cuenta:
 *   - Las contraseñas se guardan siempre con hash. Las nuevas siguen la
 *     política de seguridad/politica-de-contrasenas.js.
 */

import {
  CredencialesInvalidas,
  DatoDuplicado,
  EntradaInvalida,
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
  TokenInvalido,
} from "../../shared/errores/errores-de-dominio.js";
import { CORREO_DE_VENTA_SIN_CUENTA } from "../../shared/cuentas/venta-sin-cuenta.js";
import { EVENTOS } from "../../shared/eventos/eventos-de-dominio.js";
import { hashearContrasena, verificarContrasena } from "./seguridad/contrasenas.js";
import { exigirPoliticaDeContrasenas } from "./seguridad/politica-de-contrasenas.js";
import { validarCorreoDeRecuperacion } from "./seguridad/validar-recuperacion.js";
import { validarConsultaDeBitacora } from "./bitacora/validar-consulta-de-bitacora.js";
import { generarToken, hashearToken } from "./seguridad/tokens-de-sesion.js";
import { validarActivo, validarEmpleadoNuevo } from "./empleados/validar-empleado.js";

// Si el correo no existe se compara igual contra este hash para que la respuesta tarde lo mismo y no se pueda adivinar qué correos existen.
// PD: Gracias profe Maeva por el TIP que nos dio en redes!!!
const HASH_DE_RELLENO = "$2a$10$1vuYiMqJwRihSl4xTujnxu7/C4bPZQcfg.BGDMjcFy7ox70upM9Ja";

export class AdminService {
  #repositorio;
  #busDeEventos;
  #duracionSesionMinutos;
  #renovarSesion;
  #importacionDeExcel;
  #recuperacion;
  #avisarEnlace;

  constructor({
    repositorio,
    busDeEventos,
    duracionSesionMinutos = 25,
    renovarSesion = false,
    importacionDeExcel,
    recuperacion = { duracionMinutos: 30, urlDeLaTienda: "http://localhost:5173", devolverEnlace: false },
    // Mientras no haya envío de correos, el enlace sale en el log del servidor
    avisarEnlace = (correo, enlace) => console.info(`Enlace para recuperar la contraseña de ${correo}: ${enlace}`),
  }) {
    this.#repositorio = repositorio;
    this.#busDeEventos = busDeEventos;
    this.#duracionSesionMinutos = duracionSesionMinutos;
    this.#renovarSesion = renovarSesion;
    this.#importacionDeExcel = importacionDeExcel;
    this.#recuperacion = recuperacion;
    this.#avisarEnlace = avisarEnlace;
  }

  // Valida las credenciales y abre la sesion, hace return del token para la cookie
  async iniciarSesion({ correo, contrasena }) {
    const usuario = await this.#repositorio.buscarUsuarioPorCorreo(normalizarCorreo(correo));
    const contrasenaCorrecta = await verificarContrasena(
      contrasena,
      usuario?.contrasenaHash ?? HASH_DE_RELLENO
    );

    if (!usuario || !usuario.rol || !contrasenaCorrecta) {
      throw new CredencialesInvalidas();
    }

    return this.abrirSesion(usuario);
  }

  /**
   * Abre una sesión para alguien que ya se identificó. El registro de
   * clientes también la usa para dejar la sesión iniciada.
   */
  async abrirSesion(usuario) {
    await this.#repositorio.borrarSesionesVencidas(usuario.correo);

    const token = generarToken();
    const venceEn = this.#nuevoVencimiento();

    await this.#repositorio.crearSesion({
      correoUsuario: usuario.correo,
      tokenHash: hashearToken(token),
      venceEn,
    });

    const { contrasenaHash: _hash, ...datosDelUsuario } = usuario;
    return { token, venceEn, usuario: datosDelUsuario };
  }

  /**
   * Busca al dueño de la cookie, o null si no hay sesión vigente.
   * Con la renovación activa, una sesión que ya pasó la mitad de su duración
   * se extiende; `renovadaHasta` trae la fecha nueva para la cookie.
   */
  async identificarPorToken(token) {
    if (!token) return null;

    const tokenHash = hashearToken(token);
    const encontrado = await this.#repositorio.buscarUsuarioPorSesion(tokenHash);
    if (!encontrado) return null;

    const { venceEn, ...usuario } = encontrado;
    const quedanMs = new Date(venceEn) - Date.now();
    if (!this.#renovarSesion || quedanMs >= this.#duracionMs() / 2) {
      return { usuario, renovadaHasta: null };
    }

    const renovadaHasta = this.#nuevoVencimiento();
    await this.#repositorio.extenderSesion(tokenHash, renovadaHasta);
    return { usuario, renovadaHasta };
  }

  // Sin token no hay nada que borrar, así que cerrar dos veces no es un error
  async cerrarSesion(token) {
    if (!token) return;
    await this.#repositorio.borrarSesion(hashearToken(token));
  }

  /**
   * Cambia la contraseña de quien tiene la sesión. La sesión desde la que
   * se cambia sigue abierta y las demás se cierran.
   */
  async cambiarContrasena({ correo, actual, nueva, token }) {
    const usuario = await this.#repositorio.buscarUsuarioPorCorreo(correo);
    const actualCorrecta = usuario && (await verificarContrasena(actual, usuario.contrasenaHash));
    if (!actualCorrecta) {
      throw new EntradaInvalida("La contraseña actual no es correcta.", ["actual"]);
    }

    exigirPoliticaDeContrasenas(nueva, "nueva");

    await this.#repositorio.cambiarContrasena({
      correo: usuario.correo,
      contrasenaHash: await hashearContrasena(nueva),
      sesionQueSeQueda: hashearToken(token),
    });
  }

  /**
   * RF-54: crea el enlace para cambiar la contraseña y lo "envía". La
   * respuesta es la misma exista o no el correo, para no revelar cuáles
   * tienen cuenta; fuera de producción trae el enlace para poder probarlo.
   * @returns `{ enlace }`, con null si no hay que devolverlo
   */
  async solicitarRecuperacion(datos) {
    const correo = validarCorreoDeRecuperacion(datos);
    const usuario = await this.#repositorio.buscarUsuarioPorCorreo(correo);
    // Una cuenta desactivada no tiene rol, y la de ventas sin cuenta no es de nadie
    if (!usuario?.rol || usuario.correo === CORREO_DE_VENTA_SIN_CUENTA) return { enlace: null };

    const token = generarToken();
    await this.#repositorio.crearRecuperacion({
      correoUsuario: usuario.correo,
      tokenHash: hashearToken(token),
      venceEn: new Date(Date.now() + this.#recuperacion.duracionMinutos * 60 * 1000),
    });

    const enlace = `${this.#recuperacion.urlDeLaTienda}/restablecer?token=${token}`;
    this.#avisarEnlace(usuario.correo, enlace);
    return { enlace: this.#recuperacion.devolverEnlace ? enlace : null };
  }

  /**
   * Cambia la contraseña con el token del enlace, una sola vez. Primero se
   * revisa la contraseña nueva, así un enlace no se gasta por un error al
   * escribirla. Cierra todas las sesiones de la cuenta.
   * @throws {TokenInvalido} si el enlace no existe, ya se usó o venció
   */
  async restablecerContrasena({ token, contrasenaNueva }) {
    exigirPoliticaDeContrasenas(contrasenaNueva, "contrasenaNueva");
    if (typeof token !== "string" || token.trim() === "") throw new TokenInvalido();

    const correo = await this.#repositorio.restablecerContrasena({
      tokenHash: hashearToken(token.trim()),
      contrasenaHash: await hashearContrasena(contrasenaNueva),
    });
    if (!correo) throw new TokenInvalido();
  }

  // Importa la hoja de productos
  async importarCatalogo(archivo) {
    return this.#importacionDeExcel.importar(archivo);
  }

  // Lo llama el suscriptor de la bitácora con cada evento que hay que guardar
  async registrarEnBitacora(registro) {
    await this.#repositorio.registrarEnBitacora(registro);
  }

  /** RF-52: la bitácora para el panel, con el total para paginar. */
  async listarBitacora(consulta) {
    const filtros = validarConsultaDeBitacora(consulta);
    const { registros, total } = await this.#repositorio.listarBitacora(filtros);
    return { registros, total, pagina: filtros.pagina, limite: filtros.limite };
  }

  /**
   * El propietario crea la cuenta de un empleado. Es otra cuenta de
   * administrador: entra al panel igual, salvo crear cuentas y configurar.
   * @throws {DatoDuplicado} si el correo ya tiene una cuenta
   */
  async crearEmpleado(datos, { responsable }) {
    const { nombre, correo, contrasena } = validarEmpleadoNuevo(datos);

    const creado = await this.#repositorio.crearEmpleado({
      nombre,
      correo,
      contrasenaHash: await hashearContrasena(contrasena),
      creadoPor: responsable,
    });
    if (!creado) throw new DatoDuplicado("Ya existe una cuenta con ese correo.", ["correo"]);

    await this.#busDeEventos.publicar(EVENTOS.EMPLEADO_CREADO, {
      correoUsuario: responsable,
      entidad: "administrador",
      entidadId: correo,
      valorAnterior: null,
      valorNuevo: { nombre, activo: true },
    });
    return this.#repositorio.buscarAdministrador(correo);
  }

  async listarAdministradores() {
    return this.#repositorio.listarAdministradores();
  }

  /**
   * Activa o desactiva la cuenta de un empleado. La cuenta no se borra para
   * no perder quién hizo qué; al desactivarla se cierran sus sesiones.
   */
  async cambiarActivo(correo, datos, { responsable }) {
    const activo = validarActivo(datos);
    const cuenta = await this.#repositorio.buscarAdministrador(normalizarCorreo(correo));
    if (!cuenta) throw new RecursoNoEncontrado("la cuenta de administrador", correo);
    if (cuenta.esPropietario) {
      throw new ReglaDeNegocioViolada("La cuenta del propietario no se puede desactivar.", "RF-49");
    }
    if (cuenta.activo === activo) return cuenta;

    await this.#repositorio.cambiarActivo(cuenta.correo, activo);
    await this.#busDeEventos.publicar(EVENTOS.ESTADO_DE_EMPLEADO_CAMBIADO, {
      correoUsuario: responsable,
      entidad: "administrador",
      entidadId: cuenta.correo,
      valorAnterior: { activo: cuenta.activo },
      valorNuevo: { activo },
    });
    return { ...cuenta, activo };
  }

  #duracionMs() {
    return this.#duracionSesionMinutos * 60 * 1000;
  }

  #nuevoVencimiento() {
    return new Date(Date.now() + this.#duracionMs());
  }
}

// El correo se guarda y busca igual en minusculas y sin espacios
const normalizarCorreo = (correo) => correo.trim().toLowerCase();
