/**
 * Revisa el cuerpo de POST /ajustes: un ajuste siempre lleva su motivo (RF-20).
 */

import { crearValidacion, texto } from "../../shared/validacion/validar-campos.js";
import { leerNumero } from "./validar-ingreso.js";

const LIMITE_DEL_MOTIVO = 500;

/**
 * @returns `{ sku, cantidad, motivo }`; la cantidad es negativa si se sacan unidades
 * @throws {EntradaInvalida} con todos los campos que tienen problemas
 */
export function validarAjuste(datos = {}) {
  const validacion = crearValidacion();

  const sku = texto(datos.sku)?.toUpperCase() ?? null;
  if (!sku) validacion.anotar("sku", "Indique el producto.");

  const cantidad = leerNumero(datos.cantidad);
  if (cantidad === null) validacion.anotar("cantidad", "La cantidad es obligatoria.");
  else if (!Number.isInteger(cantidad) || cantidad === 0) {
    validacion.anotar("cantidad", "La cantidad tiene que ser un entero distinto de 0: positivo suma y negativo resta.");
  }

  const motivo = texto(datos.motivo);
  if (!motivo) validacion.anotar("motivo", "Indique el motivo del ajuste.");
  else if (motivo.length > LIMITE_DEL_MOTIVO) {
    validacion.anotar("motivo", `El motivo no puede pasar de ${LIMITE_DEL_MOTIVO} caracteres.`);
  }

  validacion.lanzarSiHayProblemas();
  return { sku, cantidad, motivo };
}
