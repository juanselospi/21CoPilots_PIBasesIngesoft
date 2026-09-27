import test from "node:test";
import assert from "node:assert/strict";

import { BusDeEventos } from "./bus-de-eventos.js";
import { EVENTOS } from "./eventos-de-dominio.js";

test("entrega el evento a todos los suscriptores", async () => {
  const bus = new BusDeEventos();
  const recibidos = [];

  bus.suscribir(EVENTOS.PEDIDO_CONFIRMADO, (datos) => recibidos.push(`a:${datos.id}`));
  bus.suscribir(EVENTOS.PEDIDO_CONFIRMADO, (datos) => recibidos.push(`b:${datos.id}`));

  await bus.publicar(EVENTOS.PEDIDO_CONFIRMADO, { id: 7 });

  assert.deepEqual(recibidos, ["a:7", "b:7"]);
});

test("RNF-06: un suscriptor que falla no tumba la publicación", async () => {
  const bus = new BusDeEventos();
  let sobrevivio = false;

  bus.suscribir(EVENTOS.PEDIDO_CONFIRMADO, () => {
    throw new Error("la factura no respondió");
  });
  bus.suscribir(EVENTOS.PEDIDO_CONFIRMADO, () => {
    sobrevivio = true;
  });

  await bus.publicar(EVENTOS.PEDIDO_CONFIRMADO, {});

  assert.equal(sobrevivio, true);
});

test("cancelar la suscripción deja de entregar el evento", async () => {
  const bus = new BusDeEventos();
  let veces = 0;

  const cancelar = bus.suscribir(EVENTOS.PEDIDO_CANCELADO, () => (veces += 1));
  await bus.publicar(EVENTOS.PEDIDO_CANCELADO, {});
  cancelar();
  await bus.publicar(EVENTOS.PEDIDO_CANCELADO, {});

  assert.equal(veces, 1);
});

