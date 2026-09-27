/**
 * Middleware de autenticación (RF-50, RF-53).
 *
 * Deja al usuario identificado en `peticion.usuario` y no decide nada
 * más: los permisos son problema de `autorizacion-por-rol.js`. Separarlos
 * permite rutas públicas autenticadas (el catálogo de un cliente logueado)
 * sin duplicar la verificación de rol.
 *
 * PENDIENTE: resolver la sesión real (token firmado o cookie de sesión).
 * Las contraseñas se almacenan con hash y salt — RNF-08 —, nunca en claro.
 */

import { NoAutenticado } from "../errores/errores-de-dominio.js";

/** Identifica al usuario si viene credencial; no bloquea si no viene. */
export function identificarUsuario(peticion, _respuesta, siguiente) {
  // PENDIENTE: leer y verificar el token de la cabecera Authorization.
  peticion.usuario = null;
  siguiente();
}

/** Exige sesión activa. Se monta solo en las rutas que la necesitan. */
export function exigirSesion(peticion, _respuesta, siguiente) {
  if (!peticion.usuario) {
    siguiente(new NoAutenticado());
    return;
  }
  siguiente();
}
