/**
 * Revisa el cuerpo de PATCH /productos/:sku/estado.
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";

const ESTADOS = Object.freeze(["activo", "descontinuado"]);

/** @returns el estado pedido */
export function validarEstadoDeProducto(datos) {
  const estado = datos?.estado;
  if (!ESTADOS.includes(estado)) {
    throw new EntradaInvalida(`El estado tiene que ser ${ESTADOS.join(" o ")}.`, ["estado"]);
  }
  return estado;
}
