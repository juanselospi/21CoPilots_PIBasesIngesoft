/**
 * Política de contraseñas que pidió el cliente: de 8 a 12 caracteres, con
 * al menos una mayúscula, un número y un carácter especial.
 *
 * Se revisan todas las reglas a la vez para decirle a la persona todo lo
 * que le falta en un solo intento.
 */

import { EntradaInvalida } from "../../../shared/errores/errores-de-dominio.js";

const LARGO = Object.freeze({ minimo: 8, maximo: 12 });

const REGLAS = Object.freeze([
  {
    cumple: (contrasena) => contrasena.length >= LARGO.minimo && contrasena.length <= LARGO.maximo,
    falta: `de ${LARGO.minimo} a ${LARGO.maximo} caracteres`,
  },
  { cumple: (contrasena) => /\p{Lu}/u.test(contrasena), falta: "al menos una mayúscula" },
  { cumple: (contrasena) => /\p{N}/u.test(contrasena), falta: "al menos un número" },
  // Especial es todo lo que no es letra ni número, como ! # $ o -
  { cumple: (contrasena) => /[^\p{L}\p{N}]/u.test(contrasena), falta: "al menos un carácter especial" },
]);

/** Lo que le falta a la contraseña, o [] si cumple todo. */
export function incumplimientosDeLaPolitica(contrasena) {
  if (typeof contrasena !== "string") return REGLAS.map(({ falta }) => falta);
  return REGLAS.filter(({ cumple }) => !cumple(contrasena)).map(({ falta }) => falta);
}

/** El mensaje con todo lo que le falta, o null si cumple. */
export function problemaDeLaContrasena(contrasena) {
  const faltan = incumplimientosDeLaPolitica(contrasena);
  return faltan.length > 0 ? `La contraseña debe tener ${unirConY(faltan)}.` : null;
}

/** @throws {EntradaInvalida} sobre `campo`, con todo lo que le falta */
export function exigirPoliticaDeContrasenas(contrasena, campo = "contrasena") {
  const problema = problemaDeLaContrasena(contrasena);
  if (problema) throw new EntradaInvalida(problema, [campo]);
}

// ["a", "b", "c"] → "a, b y c"
function unirConY(partes) {
  if (partes.length === 1) return partes[0];
  return `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}
