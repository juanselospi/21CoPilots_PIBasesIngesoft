/**
 * Máquina de estados del pedido (State, variante tabular, § 6.4).
 *
 * PENDIENTE: el CHECK de los estados ahora esta en pedidos.historial_estado.estado y no en
 * pedidos.pedido.estado. Los valores siguen coincidiendo con esta tabla.
 *
 * RF-26 define los estados y RF-28 agrega la cancelación. RN-15 permite
 * cancelar solo hasta antes del despacho.
 *
 * La base de datos solo sabe QUÉ estados existen (el CHECK de
 * `pedidos.pedido.estado`); QUÉ transiciones son legales lo sabe
 * únicamente esta tabla (§ 9.2). Los valores deben coincidir con el CHECK.
 *
 * Condiciones extra de una transición —por ejemplo, RF-36: pasar a
 * "procesado" exige pago previo si el nivel del cliente es menor a 3— las
 * verifica el servicio antes de llamar a `transicionar`.
 */

import { ReglaDeNegocioViolada } from "../../../shared/errores/errores-de-dominio.js";

export const ESTADOS = Object.freeze({
  COLOCADO: "colocado",
  PROCESADO: "procesado",
  EN_TRANSITO: "en_transito",
  FINALIZADO: "finalizado",
  CANCELADO: "cancelado",
});

/** Transiciones permitidas desde cada estado. */
const TRANSICIONES = Object.freeze({
  [ESTADOS.COLOCADO]: [ESTADOS.PROCESADO, ESTADOS.CANCELADO],
  [ESTADOS.PROCESADO]: [ESTADOS.EN_TRANSITO, ESTADOS.CANCELADO],
  [ESTADOS.EN_TRANSITO]: [ESTADOS.FINALIZADO],
  [ESTADOS.FINALIZADO]: [],
  [ESTADOS.CANCELADO]: [],
});

export const puedeTransicionar = (desde, hacia) =>
  (TRANSICIONES[desde] ?? []).includes(hacia);

/**
 * RN-15 — cancelable hasta antes del despacho. La regla se lee de la
 * misma tabla, así no puede quedar desincronizada con las transiciones.
 */
export const puedeCancelarse = (estado) =>
  puedeTransicionar(estado, ESTADOS.CANCELADO);

/**
 * Valida la transición y devuelve el estado nuevo.
 * @throws {ReglaDeNegocioViolada} si la transición no es legal
 */
export function transicionar(estadoActual, estadoNuevo) {
  if (!puedeTransicionar(estadoActual, estadoNuevo)) {
    throw new ReglaDeNegocioViolada(
      `Un pedido en estado "${estadoActual}" no puede pasar a "${estadoNuevo}".`,
      estadoNuevo === ESTADOS.CANCELADO ? "RN-15" : "RF-26"
    );
  }
  return estadoNuevo;
}
