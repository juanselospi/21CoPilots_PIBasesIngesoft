/**
 * Servicio de administración y seguridad.
 *
 * Falta implementar:
 *   - cuenta de administrador y acceso por rol (RF-49, RF-50)
 *   - modificar precios, descuentos y márgenes (RF-51)
 *   - consultar la bitácora (RF-52; el observador que la escribe ya existe)
 *   - recuperación de contraseña (RF-54)
 *
 * A tener en cuenta:
 *   - Cada cambio de parámetro publica PARAMETRO_MODIFICADO después de
 *     guardarlo, y la bitácora lo registra sola.
 *   - Los accesos denegados ya los registra el middleware de rol; no hay
 *     que registrarlos otra vez aquí.
 *   - La sesión se guarda como hash del token. El token en claro solo
 *     viaja en la cookie.
 *   - Las contraseñas se guardan siempre con hash. Deben tener de 8 a 12
 *     caracteres, con mayúscula, número y carácter especial.
 */

import {
  ErrorDeDominio,
  CredencialesInvalidas,
} from "../../shared/errores/errores-de-dominio.js";
import { verificarContrasena } from "./seguridad/contrasenas.js";
import { generarToken, hashearToken } from "./seguridad/tokens-de-sesion.js";

// Si el correo no existe se compara igual contra este hash, para que la
// respuesta tarde lo mismo y no se pueda adivinar qué correos existen.
const HASH_DE_RELLENO = "$2a$10$1vuYiMqJwRihSl4xTujnxu7/C4bPZQcfg.BGDMjcFy7ox70upM9Ja";

export class AdminService {
  #repositorio;
  #busDeEventos;
  #duracionSesionHoras;
  #importacionDeExcel;

  constructor({ repositorio, busDeEventos, duracionSesionHoras = 8, importacionDeExcel }) {
    this.#repositorio = repositorio;
    this.#busDeEventos = busDeEventos;
    this.#duracionSesionHoras = duracionSesionHoras;
    this.#importacionDeExcel = importacionDeExcel;
  }

  /** Valida las credenciales y abre la sesión. Devuelve el token para la cookie. */
  async iniciarSesion({ correo, contrasena }) {
    const usuario = await this.#repositorio.buscarUsuarioPorCorreo(correo);
    const contrasenaCorrecta = await verificarContrasena(
      contrasena,
      usuario?.contrasenaHash ?? HASH_DE_RELLENO
    );

    if (!usuario || !usuario.activo || !contrasenaCorrecta) {
      throw new CredencialesInvalidas();
    }

    const token = generarToken();
    const venceEn = new Date(Date.now() + this.#duracionSesionHoras * 60 * 60 * 1000);

    await this.#repositorio.crearSesion({
      usuarioId: usuario.id,
      tokenHash: hashearToken(token),
      venceEn,
    });

    const { contrasenaHash: _hash, activo: _activo, ...datosDelUsuario } = usuario;
    return { token, venceEn, usuario: datosDelUsuario };
  }

  /** Usuario dueño del token de la cookie, o `null` si no hay sesión válida. */
  async identificarPorToken(token) {
    if (!token) return null;
    return this.#repositorio.buscarUsuarioPorSesion(hashearToken(token));
  }

  /**
   * Importa la hoja de productos. Devuelve cuántas filas se leyeron,
   * cuántos productos se crearon y actualizaron, y las filas rechazadas
   * con sus motivos.
   */
  async importarCatalogo(archivo) {
    return this.#importacionDeExcel.importar(archivo);
  }

  /**
   * Lee un parámetro de negocio numérico. Lo usa, por ejemplo, el módulo
   * de clientes para leer `monto_minimo_descuento`.
   */
  async obtenerNumero(clave) {
    const valor = await this.#repositorio.obtenerParametro(clave);
    const numero = Number(valor);

    if (valor === null || !Number.isFinite(numero)) {
      throw new ErrorDeDominio(
        `El parámetro de negocio "${clave}" no existe o no es numérico.`,
        { codigo: "PARAMETRO_INVALIDO" }
      );
    }
    return numero;
  }
}
