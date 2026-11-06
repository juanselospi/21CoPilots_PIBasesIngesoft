/**
 * Revisa el cuerpo de POST /admin/:correo/:numCarrito/lineas/:sku/reemplazo.
 */

import { crearValidacion, texto } from "../../../shared/validacion/validar-campos.js";

/** @returns el SKU del producto nuevo, en mayúsculas */
export function validarReemplazo(datos = {}, skuActual) {
  const validacion = crearValidacion();
  const skuNuevo = texto(datos?.skuNuevo)?.toUpperCase() ?? null;

  if (!skuNuevo) validacion.anotar("skuNuevo", "Indique el producto nuevo.");
  else if (skuNuevo === skuActual) validacion.anotar("skuNuevo", "El producto nuevo tiene que ser distinto del actual.");

  validacion.lanzarSiHayProblemas();
  return skuNuevo;
}
