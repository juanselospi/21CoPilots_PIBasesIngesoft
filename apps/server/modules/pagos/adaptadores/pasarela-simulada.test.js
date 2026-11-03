import test from "node:test";
import assert from "node:assert/strict";

import { PasarelaSimulada } from "./pasarela-simulada.js";

test("una tarjeta cualquiera se aprueba con una referencia única", async () => {
  const pasarela = new PasarelaSimulada();

  const primero = await pasarela.cobrar({ monto: 10, metodo: "tarjeta", datosTarjeta: { numero: "4111111111111111" } });
  const segundo = await pasarela.cobrar({ monto: 10, metodo: "tarjeta", datosTarjeta: { numero: "4111111111111111" } });

  assert.equal(primero.resultado, "aprobado");
  assert.notEqual(primero.referencia, segundo.referencia);
});

test("para la demo, una tarjeta que termina en 0000 se rechaza", async () => {
  const resultado = await new PasarelaSimulada().cobrar({
    monto: 10,
    metodo: "tarjeta",
    datosTarjeta: { numero: "4111111111110000" },
  });

  assert.equal(resultado.resultado, "rechazado");
  assert.equal(resultado.motivo, "TARJETA_RECHAZADA");
});

test("contra entrega queda pendiente y sin referencia", async () => {
  assert.deepEqual(await new PasarelaSimulada().cobrar({ monto: 10, metodo: "contra_entrega" }), {
    resultado: "pendiente",
    referencia: null,
    motivo: "PAGO_CONTRA_ENTREGA",
  });
});
