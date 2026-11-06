import test from "node:test";
import assert from "node:assert/strict";

import {
  ESTADOS,
  esFinal,
  estadoAnterior,
  puedeCancelarse,
  siguientesEstados,
  transicionar,
} from "./maquina-de-estados.js";

test("RN-15: un pedido se cancela hasta antes del despacho", () => {
  assert.equal(puedeCancelarse(ESTADOS.COLOCADO), true);
  assert.equal(puedeCancelarse(ESTADOS.PROCESADO), true);
  assert.equal(puedeCancelarse(ESTADOS.EN_TRANSITO), false);
  assert.equal(puedeCancelarse(ESTADOS.FINALIZADO), false);
});

test("RF-26: recorre el ciclo completo del pedido", () => {
  let estado = ESTADOS.COLOCADO;
  estado = transicionar(estado, ESTADOS.PROCESADO);
  estado = transicionar(estado, ESTADOS.EN_TRANSITO);
  estado = transicionar(estado, ESTADOS.FINALIZADO);

  assert.equal(estado, ESTADOS.FINALIZADO);
});

test("una transición ilegal se rechaza con la regla que la prohíbe", () => {
  assert.throws(
    () => transicionar(ESTADOS.EN_TRANSITO, ESTADOS.CANCELADO),
    (error) => error.codigo === "REGLA_DE_NEGOCIO_VIOLADA" &&
      error.detalles.regla === "RN-15"
  );
});

test("un pedido cancelado o finalizado ya no cambia de estado", () => {
  assert.throws(() => transicionar(ESTADOS.CANCELADO, ESTADOS.PROCESADO));
  assert.throws(() => transicionar(ESTADOS.FINALIZADO, ESTADOS.EN_TRANSITO));
});

test("en disputa entra desde cualquier estado que no sea final", () => {
  for (const estado of [ESTADOS.COLOCADO, ESTADOS.PROCESADO, ESTADOS.EN_TRANSITO]) {
    assert.equal(transicionar(estado, ESTADOS.EN_DISPUTA), ESTADOS.EN_DISPUTA);
  }
  assert.throws(() => transicionar(ESTADOS.FINALIZADO, ESTADOS.EN_DISPUTA));
  assert.throws(() => transicionar(ESTADOS.CANCELADO, ESTADOS.EN_DISPUTA));
});

test("una disputa se resuelve volviendo al estado en que estaba", () => {
  const historial = [ESTADOS.COLOCADO, ESTADOS.PROCESADO, ESTADOS.EN_TRANSITO, ESTADOS.EN_DISPUTA].map((estado) => ({ estado }));
  const anterior = estadoAnterior(historial);

  assert.equal(anterior, ESTADOS.EN_TRANSITO);
  assert.equal(transicionar(ESTADOS.EN_DISPUTA, ESTADOS.EN_TRANSITO, anterior), ESTADOS.EN_TRANSITO);
  // No puede saltarse pasos al salir de la disputa
  assert.throws(() => transicionar(ESTADOS.EN_DISPUTA, ESTADOS.FINALIZADO, anterior));
  assert.throws(() => transicionar(ESTADOS.EN_DISPUTA, ESTADOS.EN_DISPUTA, anterior));
});

test("una disputa de un pedido que no ha salido también puede terminar en cancelación", () => {
  assert.deepEqual(siguientesEstados(ESTADOS.EN_DISPUTA, ESTADOS.PROCESADO), [ESTADOS.PROCESADO, ESTADOS.CANCELADO]);
  assert.equal(puedeCancelarse(ESTADOS.EN_DISPUTA, ESTADOS.EN_TRANSITO), false);
});

test("el estado anterior solo existe mientras el pedido está en disputa", () => {
  assert.equal(estadoAnterior([{ estado: ESTADOS.COLOCADO }]), null);
  // Si ya tuvo otra disputa resuelta, cuenta la última
  const historial = [ESTADOS.COLOCADO, ESTADOS.EN_DISPUTA, ESTADOS.COLOCADO, ESTADOS.PROCESADO, ESTADOS.EN_DISPUTA].map((estado) => ({ estado }));
  assert.equal(estadoAnterior(historial), ESTADOS.PROCESADO);
});

test("finalizado y cancelado son los únicos estados finales", () => {
  assert.deepEqual(Object.values(ESTADOS).filter((estado) => esFinal(estado)), [ESTADOS.FINALIZADO, ESTADOS.CANCELADO]);
});
