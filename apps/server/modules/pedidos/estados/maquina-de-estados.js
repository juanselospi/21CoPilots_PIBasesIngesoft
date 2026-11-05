/**
 * Máquina de estados del pedido (State, variante tabular).
 *
 * «Finalizado» es el entregado que el administrador marca al final del día.
 * «En disputa» marca un pedido con un problema mientras se resuelve: entra
 * desde cualquier estado que no sea final y sale de vuelta al estado en que
 * estaba, que se lee del historial.
 */

import { ReglaDeNegocioViolada } from "../../../shared/errores/errores-de-dominio.js";

export const ESTADOS = Object.freeze({
  COLOCADO: "colocado",
  PROCESADO: "procesado",
  EN_TRANSITO: "en_transito",
  FINALIZADO: "finalizado",
  CANCELADO: "cancelado",
  EN_DISPUTA: "en_disputa",
});

/** Transiciones permitidas desde cada estado; las de «en disputa» dependen del anterior. */
const TRANSICIONES = Object.freeze({
  [ESTADOS.COLOCADO]: [ESTADOS.PROCESADO, ESTADOS.CANCELADO, ESTADOS.EN_DISPUTA],
  [ESTADOS.PROCESADO]: [ESTADOS.EN_TRANSITO, ESTADOS.CANCELADO, ESTADOS.EN_DISPUTA],
  [ESTADOS.EN_TRANSITO]: [ESTADOS.FINALIZADO, ESTADOS.EN_DISPUTA],
  [ESTADOS.FINALIZADO]: [],
  [ESTADOS.CANCELADO]: [],
});

export const esFinal = (estado) => TRANSICIONES[estado]?.length === 0;

/** Las líneas se editan antes del envío o mientras hay una disputa abierta. */
export const admiteEdicion = (estado) =>
  [ESTADOS.COLOCADO, ESTADOS.PROCESADO, ESTADOS.EN_DISPUTA].includes(estado);

/**
 * A qué estados puede pasar. Una disputa se resuelve volviendo al estado
 * anterior, o cancelando si ese estado todavía se podía cancelar.
 */
export function siguientesEstados(actual, anterior = null) {
  if (actual !== ESTADOS.EN_DISPUTA) return TRANSICIONES[actual] ?? [];
  if (!anterior || anterior === ESTADOS.EN_DISPUTA || esFinal(anterior)) return [];
  return puedeCancelarse(anterior) ? [anterior, ESTADOS.CANCELADO] : [anterior];
}

export const puedeTransicionar = (desde, hacia, anterior = null) =>
  siguientesEstados(desde, anterior).includes(hacia);

/** RN-15: cancelable hasta antes del despacho. Sale de la misma tabla que las transiciones. */
export const puedeCancelarse = (estado, anterior = null) =>
  puedeTransicionar(estado, ESTADOS.CANCELADO, anterior);

/**
 * El estado en que estaba antes de la disputa vigente, o null si no está
 * en disputa. `historial` va del primer estado al vigente.
 */
export function estadoAnterior(historial) {
  const estados = historial.map(({ estado }) => estado);
  if (estados.at(-1) !== ESTADOS.EN_DISPUTA) return null;
  return estados.findLast((estado) => estado !== ESTADOS.EN_DISPUTA) ?? null;
}

/**
 * Valida la transición y devuelve el estado nuevo.
 * @throws {ReglaDeNegocioViolada} si la transición no es legal
 */
export function transicionar(estadoActual, estadoNuevo, anterior = null) {
  if (!puedeTransicionar(estadoActual, estadoNuevo, anterior)) {
    throw new ReglaDeNegocioViolada(
      `Un pedido en estado "${estadoActual}" no puede pasar a "${estadoNuevo}".`,
      estadoNuevo === ESTADOS.CANCELADO ? "RN-15" : "RF-26"
    );
  }
  return estadoNuevo;
}
