/**
 * Junta los problemas de un formulario para responderlos todos de una vez,
 * en vez de que el usuario los vaya descubriendo uno por uno.
 *
 *   const validacion = crearValidacion();
 *   if (!nombre) validacion.anotar("nombre", "El nombre es obligatorio.");
 *   validacion.lanzarSiHayProblemas();
 */

import { EntradaInvalida } from "../errores/errores-de-dominio.js";

export function crearValidacion() {
  const errores = [];

  return {
    /** Un mismo mensaje puede marcar varios campos, como un rango al revés. */
    anotar(campos, mensaje) {
      for (const campo of [campos].flat()) errores.push({ campo, mensaje });
    },

    get hayProblemas() {
      return errores.length > 0;
    },

    /** @throws {EntradaInvalida} con `campos` y `errores` en los detalles */
    lanzarSiHayProblemas() {
      if (errores.length === 0) return;

      const mensajes = [...new Set(errores.map(({ mensaje }) => mensaje))];
      throw new EntradaInvalida(
        mensajes.join(" "),
        errores.map(({ campo }) => campo),
        errores.map((error) => ({ ...error }))
      );
    },
  };
}

/** Texto sin espacios en los extremos, o null si viene vacío. */
export function texto(valor) {
  if (typeof valor !== "string") return null;
  return valor.trim() || null;
}
