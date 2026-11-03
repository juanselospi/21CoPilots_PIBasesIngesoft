/**
 * Middleware de autenticación.
 *
 * Deja al usuario identificado en `peticion.usuario` y no decide nada
 * más: los permisos son problema de `autorizacion-por-rol.js`.
 *
 * La sesión viaja en la cookie `sesion`; usuarios.sesion guarda solo el hash
 * del token. Las contraseñas se almacenan con hash y salt, nunca le limpio.
 */

import { NoAutenticado } from "../errores/errores-de-dominio.js";

export const COOKIE_DE_SESION = "sesion";

// HttpOnly para que el JavaScript de la página no pueda leer la cookie
const OPCIONES_DE_LA_COOKIE = Object.freeze({ httpOnly: true, sameSite: "lax", path: "/api" });

/** `segura` solo en producción, que es donde hay HTTPS. */
export function escribirCookieDeSesion(respuesta, token, venceEn, { segura = false } = {}) {
  respuesta.cookie(COOKIE_DE_SESION, token, { ...OPCIONES_DE_LA_COOKIE, secure: segura, expires: venceEn });
}

export function borrarCookieDeSesion(respuesta, { segura = false } = {}) {
  respuesta.clearCookie(COOKIE_DE_SESION, { ...OPCIONES_DE_LA_COOKIE, secure: segura });
}

/**
 * Identifica al usuario si viene la cookie; no bloquea si no viene.
 * La búsqueda por token se inyecta desde la raíz de composición y devuelve
 * `{ usuario, renovadaHasta }`, o null si la sesión no existe o venció.
 */
export function crearIdentificarUsuario(identificarPorToken, { cookieSegura = false } = {}) {
  return async (peticion, respuesta, siguiente) => {
    try {
      const token = peticion.cookies?.[COOKIE_DE_SESION];
      const sesion = token ? await identificarPorToken(token) : null;
      peticion.usuario = sesion?.usuario ?? null;

      // Si la sesión se extendió hay que extender también la cookie, o el
      // navegador la borraría a la hora de antes.
      if (sesion?.renovadaHasta) {
        escribirCookieDeSesion(respuesta, token, sesion.renovadaHasta, { segura: cookieSegura });
      }
      siguiente();
    } catch (error) {
      siguiente(error);
    }
  };
}

/** Exige sesión activa. Se monta solo en las rutas que la necesitan. */
export function exigirSesion(peticion, _respuesta, siguiente) {
  if (!peticion.usuario) {
    siguiente(new NoAutenticado());
    return;
  }
  siguiente();
}
