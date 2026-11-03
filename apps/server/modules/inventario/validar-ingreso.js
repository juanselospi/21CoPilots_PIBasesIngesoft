/**
 * Revisa el cuerpo de POST /ingresos: producto, cantidad y costo de esa compra.
 */

import { crearValidacion, texto } from "../../shared/validacion/validar-campos.js";

const COSTO_MAXIMO = 9_999_999_999.99; // NUMERIC(12,2)
const CANTIDAD_MAXIMA = 2_147_483_647; //  INTEGER

/** Número de un campo que puede llegar como texto desde el formulario; NaN si no es número. */
export function leerNumero(valor) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor === "number") return valor;
  if (typeof valor !== "string") return NaN;
  return valor.trim() === "" ? null : Number(valor);
}

/**
 * @returns `{ sku, cantidad, costoUnitario }` con el SKU en mayúsculas
 * @throws {EntradaInvalida} con todos los campos que tienen problemas
 */
export function validarIngreso(datos = {}) {
  const validacion = crearValidacion();

  const sku = texto(datos.sku)?.toUpperCase() ?? null;
  if (!sku) validacion.anotar("sku", "Indique el producto.");

  const cantidad = leerNumero(datos.cantidad);
  if (cantidad === null) validacion.anotar("cantidad", "La cantidad es obligatoria.");
  else if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > CANTIDAD_MAXIMA) {
    validacion.anotar("cantidad", "La cantidad tiene que ser un número entero mayor que 0.");
  }

  const costoUnitario = leerNumero(datos.costoUnitario);
  if (costoUnitario === null) validacion.anotar("costoUnitario", "El costo de la compra es obligatorio.");
  else if (Number.isNaN(costoUnitario) || costoUnitario < 0 || costoUnitario > COSTO_MAXIMO) {
    validacion.anotar("costoUnitario", "El costo tiene que ser un número de 0 o más.");
  }

  validacion.lanzarSiHayProblemas();
  return { sku, cantidad, costoUnitario };
}
