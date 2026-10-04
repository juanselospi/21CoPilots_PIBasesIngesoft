/**
 * Tokens de sesión. RF-53.
 *
 * Token aleatorio de 256 bits para la cookie; usuarios.sesion guarda su hash
 * SHA-256. No usa bcrypt: el token no es una contraseña elegida por el usuario.
 */

import { randomBytes, createHash } from "node:crypto";

export function generarToken() {
  return randomBytes(32).toString("base64url");
}

export function hashearToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
