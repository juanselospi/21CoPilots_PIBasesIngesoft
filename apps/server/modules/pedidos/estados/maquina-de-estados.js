/**
 * Máquina de estados del pedido (State, variante tabular, § 6.4).
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
