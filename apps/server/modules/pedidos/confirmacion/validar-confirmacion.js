/**
 * Revisa lo que manda el checkout al confirmar: entrega y medio de pago.
 */

import { EntradaInvalida } from "../../../shared/errores/errores-de-dominio.js";
import { crearValidacion } from "../../../shared/validacion/validar-campos.js";
import { validarEntrega } from "../entrega/modalidades-de-entrega.js";

// Los que puede escoger el cliente en la tienda; efectivo y datáfono son de ventas en el negocio
export const METODOS_DE_PAGO_EN_LINEA = Object.freeze(["tarjeta", "sinpe_movil", "contra_entrega"]);

/**
 * Con `usarCredito` el medio de pago puede faltar: si el saldo no alcanza,
 * la confirmación lo pide para cobrar la diferencia.
 * @returns `{ modalidadEntrega, direccion, metodoPago, datosTarjeta, usarCredito }`;
 *   los datos de la tarjeta solo pasan a la pasarela y nunca se guardan (RNF-09)
 * @throws {EntradaInvalida} con todos los campos que tienen problemas
 */
export function validarConfirmacion(datos = {}) {
  const validacion = crearValidacion();

  let entrega = null;
  try {
    entrega = validarEntrega(datos);
  } catch (error) {
    if (!(error instanceof EntradaInvalida)) throw error;
    validacion.anotar(error.detalles.campos, error.message);
  }

  const usarCredito = datos.usarCredito ?? false;
  if (typeof usarCredito !== "boolean") validacion.anotar("usarCredito", "Indique si quiere usar su crédito (true o false).");

  const metodoPago = datos.metodoPago ?? null;
  const puedeFaltar = usarCredito === true && metodoPago === null;
  if (!puedeFaltar && !METODOS_DE_PAGO_EN_LINEA.includes(metodoPago)) {
    validacion.anotar("metodoPago", `El medio de pago tiene que ser uno de: ${METODOS_DE_PAGO_EN_LINEA.join(", ")}.`);
  }

  const datosTarjeta = datos.datosTarjeta ?? null;
  if (metodoPago === "tarjeta" && (typeof datosTarjeta?.numero !== "string" || !/^\d{12,19}$/.test(datosTarjeta.numero))) {
    validacion.anotar("datosTarjeta", "Indique el número de la tarjeta, de 12 a 19 dígitos.");
  }

  validacion.lanzarSiHayProblemas();
  return { ...entrega, metodoPago, datosTarjeta: metodoPago === "tarjeta" ? datosTarjeta : null, usarCredito };
}
