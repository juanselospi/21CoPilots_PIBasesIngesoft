/**
 * Middleware de autenticación (RF-50, RF-53).
 *
 * Deja al usuario identificado en `peticion.usuario` y no decide nada
 * más: los permisos son problema de `autorizacion-por-rol.js`. Separarlos
 * permite rutas públicas autenticadas (el catálogo de un cliente logueado)
 * sin duplicar la verificación de rol.
 *
 * La sesión viaja en la cookie `sesion`; admin.sesion guarda solo el hash
 * del token. Las contraseñas se almacenan con hash y salt — RNF-08 —,
 * nunca en claro.
 */

import { NoAutenticado } from "../errores/errores-de-dominio.js";

export const COOKIE_DE_SESION = "sesion";

/**
 * Identifica al usuario si viene la cookie; no bloquea si no viene.
 * La búsqueda por token se inyecta desde la raíz de composición.
 */
export function crearIdentificarUsuario(buscarUsuarioPorToken) {
  return async (peticion, _respuesta, siguiente) => {
    try {
      const token = peticion.cookies?.[COOKIE_DE_SESION];
      peticion.usuario = token ? await buscarUsuarioPorToken(token) : null;
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
