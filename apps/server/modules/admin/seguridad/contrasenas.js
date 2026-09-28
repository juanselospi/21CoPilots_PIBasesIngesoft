/**
 * Hash y verificación de contraseñas. RNF-08, SCRUM-7.
 *
 * bcrypt genera un salt aleatorio por cada hash y lo guarda dentro del
 * mismo texto, así que dos usuarios con la misma contraseña quedan con
 * hashes distintos y no hace falta una columna aparte para el salt.
 *
 * Es compatible con los hashes que crea PostgreSQL con
 * `crypt(..., gen_salt('bf', 10))` en las semillas.
 */

import bcrypt from "bcryptjs";

const RONDAS = 10;

export function hashearContrasena(contrasena) {
  return bcrypt.hash(contrasena, RONDAS);
}

export function verificarContrasena(contrasena, hash) {
  return bcrypt.compare(contrasena, hash);
}
