/**
 * Reglas del costo, la importación y el margen de un producto.
 *
 * Las usan el registro de un producto nuevo y la edición del precio, para
 * que los dos acepten exactamente lo mismo y con los mismos mensajes. Los
 * límites son los de las columnas de catalogo.producto.
 *
 * Cada regla recibe el valor ya convertido con `numero` y devuelve el
 * mensaje del problema, o null si el valor sirve.
 */

const LIMITES = Object.freeze({
  costo: 9_999_999_999.99, // NUMERIC(12,2)
  porcentaje: 9_999.99, //    NUMERIC(6,2)
});

export function problemaDelCosto(costoItem) {
  if (costoItem === null) return "El costo es obligatorio.";
  if (Number.isNaN(costoItem)) return "El costo tiene que ser un número.";
  if (costoItem < 0) return "El costo no puede ser negativo.";
  if (costoItem > LIMITES.costo) return "El costo es demasiado grande.";
  return null;
}

export function problemaDeLaImportacion(porcentajeImportacion) {
  if (Number.isNaN(porcentajeImportacion) || porcentajeImportacion < 0 || porcentajeImportacion > LIMITES.porcentaje) {
    return "El porcentaje de importación tiene que ser un número de 0 o más.";
  }
  return null;
}

// El margen puede ser negativo (liquidaciones), pero con -100 % el
// producto quedaría gratis (RN-02).
export function problemaDelMargen(margenGanancia) {
  if (Number.isNaN(margenGanancia) || margenGanancia <= -100 || margenGanancia > LIMITES.porcentaje) {
    return "El margen tiene que ser un número mayor que -100 %.";
  }
  return null;
}

/**
 * Los formularios mandan los números como texto ("12.5"). Devuelve null
 * si no viene y NaN si viene algo que no es número.
 */
export function numero(valor) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor === "number") return valor;
  if (typeof valor !== "string") return NaN;
  // Number("  ") da 0; un campo en blanco cuenta como que no vino.
  return valor.trim() === "" ? null : Number(valor);
}
