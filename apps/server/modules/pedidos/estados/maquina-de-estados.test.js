import test from "node:test";
import assert from "node:assert/strict";

import {
  ESTADOS,
  puedeCancelarse,
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
