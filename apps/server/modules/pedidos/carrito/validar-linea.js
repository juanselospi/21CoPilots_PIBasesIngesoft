/**
 * Revisa el producto y la cantidad de una línea del carrito.
 */

import { crearValidacion, texto } from "../../../shared/validacion/validar-campos.js";

const CANTIDAD_MAXIMA = 999;

/** Revisa solo la cantidad, para cambiarla en una línea que ya existe. */
export function validarCantidad(datos = {}) {
  const validacion = crearValidacion();
  const cantidad = leerCantidad(datos.cantidad, validacion);
  validacion.lanzarSiHayProblemas();
  return cantidad;
}

/** @returns `{ sku, cantidad }` con el SKU en mayúsculas */
export function validarLinea(datos = {}) {
  const validacion = crearValidacion();

  const sku = texto(datos.sku)?.toUpperCase() ?? null;
  if (!sku) validacion.anotar("sku", "Indique el producto.");
  const cantidad = leerCantidad(datos.cantidad, validacion);

  validacion.lanzarSiHayProblemas();
  return { sku, cantidad };
}

function leerCantidad(valor, validacion) {
  const cantidad = typeof valor === "string" && valor.trim() !== "" ? Number(valor) : valor;
  if (cantidad === undefined || cantidad === null || cantidad === "") {
    validacion.anotar("cantidad", "Indique la cantidad.");
  } else if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > CANTIDAD_MAXIMA) {
    validacion.anotar("cantidad", `La cantidad tiene que ser un entero de 1 a ${CANTIDAD_MAXIMA}.`);
  }
  return cantidad;
}
