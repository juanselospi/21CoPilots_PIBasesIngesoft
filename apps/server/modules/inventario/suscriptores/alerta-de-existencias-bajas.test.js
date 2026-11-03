import test from "node:test";
import assert from "node:assert/strict";

import { registrarAlertaDeExistenciasBajas } from "./alerta-de-existencias-bajas.js";
import { BusDeEventos } from "../../../shared/eventos/bus-de-eventos.js";
import { EVENTOS } from "../../../shared/eventos/eventos-de-dominio.js";

function crearBus() {
  const bus = new BusDeEventos();
  const alertas = [];
  bus.suscribir(EVENTOS.EXISTENCIAS_BAJAS, (alerta) => alertas.push(alerta));
  registrarAlertaDeExistenciasBajas(bus, { umbral: 2 });
  return { bus, alertas };
}

const moverStock = (bus, cantidad, existenciasResultantes) =>
  bus.publicar(EVENTOS.MOVIMIENTO_REGISTRADO, { sku: "LEG-001", cantidad, existenciasResultantes });

test("avisa cuando una venta deja el stock en el umbral", async () => {
  const { bus, alertas } = crearBus();

  await moverStock(bus, -1, 2);

  assert.equal(alertas.length, 1);
  assert.equal(alertas[0].sku, "LEG-001");
  assert.equal(alertas[0].existencias, 2);
});

test("no repite la alerta en las ventas que siguen por debajo del umbral", async () => {
  const { bus, alertas } = crearBus();

  await moverStock(bus, -1, 2);
  await moverStock(bus, -1, 1);

  assert.equal(alertas.length, 1);
});

test("no avisa si el stock sigue arriba del umbral ni cuando un ingreso lo sube", async () => {
  const { bus, alertas } = crearBus();

  await moverStock(bus, -1, 5);
  await moverStock(bus, 10, 11);

  assert.deepEqual(alertas, []);
});

test("sin la cantidad del movimiento avisa siempre que quede en el umbral o por debajo", async () => {
  const { bus, alertas } = crearBus();

  await bus.publicar(EVENTOS.MOVIMIENTO_REGISTRADO, { sku: "LEG-001", existenciasResultantes: 1 });

  assert.equal(alertas.length, 1);
});
