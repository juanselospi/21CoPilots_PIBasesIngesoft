/**
 * Hash y verificación de contraseñas.
 *
 * bcrypt con salt por hash.
 */

import bcrypt from "bcryptjs";

const RONDAS = 10;

export function hashearContrasena(contrasena) {
  return bcrypt.hash(contrasena, RONDAS);
}

export function verificarContrasena(contrasena, hash) {
  return bcrypt.compare(contrasena, hash);
}
