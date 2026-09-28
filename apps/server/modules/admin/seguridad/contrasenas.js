/**
 * Hash y verificación de contraseñas. RNF-08.
 *
 * bcrypt con salt por hash (incluido en el mismo texto) y 10 rondas.
 * Compatible con `crypt(..., gen_salt('bf', 10))` de las semillas.
 */

import bcrypt from "bcryptjs";

const RONDAS = 10;

export function hashearContrasena(contrasena) {
  return bcrypt.hash(contrasena, RONDAS);
}

export function verificarContrasena(contrasena, hash) {
  return bcrypt.compare(contrasena, hash);
}
