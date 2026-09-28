/**
 * CAPA DE DOMINIO — Administración y seguridad.
 *
 * POR IMPLEMENTAR
 *   RF-49, RF-50  Cuenta de administrador y acceso por rol
 *   RF-51         Modificar precios, descuentos y márgenes
 *   RF-52         Bitácora de auditoría (el observador ya existe)
 *   RF-54         Recuperación de contraseña
 *   RF-57..RF-59  Importación del Excel (SUP-01)
 *
 * Reglas al implementar:
 *   · Todo cambio de parámetro publica PARAMETRO_MODIFICADO después de
 *     guardarlo; la bitácora lo registra sola (§ 6.2).
 *   · RNF-10: los intentos no autorizados ya los registra el middleware
 *     de rol. No duplicar ese registro aquí.
 *   · La importación extiende `importacion/plantilla-de-importacion.js`
 *     (Template Method, § 6.6); no reescribir el bucle de importación.
 *   · RF-53: la sesión se guarda como hash del token (admin.sesion); el
 *     token en claro solo viaja en la cookie.
 *   · RNF-08: hash antes de persistir cualquier contraseña. La política
 *     de contraseña es de 8 a 12 caracteres, con mayúscula, número y
 *     carácter especial (aprobado #15).
 */

import {
  ErrorDeDominio,
  CredencialesInvalidas,
} from "../../shared/errores/errores-de-dominio.js";
import { verificarContrasena } from "./seguridad/contrasenas.js";
import { generarToken, hashearToken } from "./seguridad/tokens-de-sesion.js";

// Correo inexistente: se verifica contra este hash para igualar el tiempo de respuesta.
const HASH_DE_RELLENO = "$2a$10$1vuYiMqJwRihSl4xTujnxu7/C4bPZQcfg.BGDMjcFy7ox70upM9Ja";

export class AdminService {
  #repositorio;
  #busDeEventos;
  #duracionSesionHoras;

  constructor({ repositorio, busDeEventos, duracionSesionHoras = 8 }) {
    this.#repositorio = repositorio;
    this.#busDeEventos = busDeEventos;
    this.#duracionSesionHoras = duracionSesionHoras;
  }

  /** RF-53 — valida credenciales y abre sesión. Devuelve el token para la cookie. */
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

  /** RF-53 — usuario dueño del token de la cookie, o `null`. */
  async identificarPorToken(token) {
    if (!token) return null;
    return this.#repositorio.buscarUsuarioPorSesion(hashearToken(token));
  }

  /**
   * Parámetro de negocio numérico (DD-14). Lo usa, por ejemplo, el módulo
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
