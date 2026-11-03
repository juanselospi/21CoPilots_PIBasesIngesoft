/**
 * Servicio de administración y seguridad.
 *
 * Falta implementar:
 *   - cuenta de administrador y acceso por rol
 *   - modificar precios, descuentos y márgenes
 *   - consultar la bitacora, queda pendiente porque el modelo no tiene tabla de bitacora
 *   - recuperación de contraseña
 *
 * A tener en cuenta:
 *   - Las contraseñas se guardan siempre con hash. Deben tener de 8 a 12
 *     caracteres, con mayúscula, número y carácter especial como nos pidió el cliente.
 */

import { CredencialesInvalidas } from "../../shared/errores/errores-de-dominio.js";
import { verificarContrasena } from "./seguridad/contrasenas.js";
import { generarToken, hashearToken } from "./seguridad/tokens-de-sesion.js";

// Si el correo no existe se compara igual contra este hash para que la respuesta tarde lo mismo y no se pueda adivinar qué correos existen.
// PD: Gracias profe Maeva por el TIP que nos dio en redes!!!
const HASH_DE_RELLENO = "$2a$10$1vuYiMqJwRihSl4xTujnxu7/C4bPZQcfg.BGDMjcFy7ox70upM9Ja";

export class AdminService {
  #repositorio;
  #busDeEventos;
  #duracionSesionMinutos;
  #renovarSesion;
  #importacionDeExcel;

  constructor({ repositorio, busDeEventos, duracionSesionMinutos = 25, renovarSesion = false, importacionDeExcel }) {
    this.#repositorio = repositorio;
    this.#busDeEventos = busDeEventos;
    this.#duracionSesionMinutos = duracionSesionMinutos;
    this.#renovarSesion = renovarSesion;
    this.#importacionDeExcel = importacionDeExcel;
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

  // Importa la hoja de productos
  async importarCatalogo(archivo) {
    return this.#importacionDeExcel.importar(archivo);
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
