import test from "node:test";
import assert from "node:assert/strict";

import { BusDeEventos } from "./bus-de-eventos.js";
import { EVENTOS } from "./eventos-de-dominio.js";
import { registrarAlertaDeExistenciasBajas } from "../../modules/inventario/suscriptores/alerta-de-existencias-bajas.js";

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

test("RF-16 / RN-04: la alerta salta al llegar al umbral de dos unidades", async () => {
  const bus = new BusDeEventos();
  const alertas = [];

  registrarAlertaDeExistenciasBajas(bus, { umbral: 2 });
  bus.suscribir(EVENTOS.EXISTENCIAS_BAJAS, (datos) => alertas.push(datos));

  await bus.publicar(EVENTOS.MOVIMIENTO_REGISTRADO, {
    sku: "SKU-1",
    existenciasResultantes: 3,
  });
  await bus.publicar(EVENTOS.MOVIMIENTO_REGISTRADO, {
    sku: "SKU-1",
    existenciasResultantes: 2,
  });

  assert.equal(alertas.length, 1);
  assert.equal(alertas[0].existencias, 2);
});
