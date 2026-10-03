import test from "node:test";
import assert from "node:assert/strict";

import { MotorDePrecios } from "./motor-de-precios.js";
import { ImportacionPorAranceles } from "./pasos/importacion-por-aranceles.js";
import { MargenDeGanancia } from "./pasos/margen-de-ganancia.js";
import { ImpuestoDeVenta } from "./pasos/impuesto-de-venta.js";

const motor = new MotorDePrecios([
  new ImportacionPorAranceles(),
  new MargenDeGanancia(),
  new ImpuestoDeVenta(),
]);

test("RN-01: aplica importación, margen e impuesto en ese orden", () => {
  const { precioFinal, desglose } = motor.calcular({
    costoItem: 100,
    porcentajeImportacion: 20,
    margenGanancia: 50,
    tasaImpuesto: 13,
  });

  // 100 → 120 (aranceles) → 180 (margen) → 203,4 (impuesto)
  assert.equal(precioFinal, 203.4);
  assert.deepEqual(
    desglose.map((paso) => paso.paso),
    ["costo", "importacion", "margen", "impuesto"]
  );
});

test("RN-02: un margen negativo vende por debajo del costo", () => {
  const { precioFinal } = motor.calcular({
    costoItem: 100,
    porcentajeImportacion: 0,
    margenGanancia: -20,
    tasaImpuesto: 13,
  });

  assert.equal(precioFinal, 90.4); // 80 + 13 %
});

// Los tres ejemplos de documentos/diseño/formula-precio.md
test("$100 con 20 % de importación y 25 % de margen da $169,50", () => {
  const { precioFinal, desglose } = motor.calcular({
    costoItem: 100,
    porcentajeImportacion: 20,
    margenGanancia: 25,
    tasaImpuesto: 13,
  });

  assert.equal(precioFinal, 169.5);
  assert.deepEqual(desglose.map((paso) => paso.monto), [100, 120, 150, 169.5]);
});

test("un margen de -10 % sobre el mismo producto da $122,04", () => {
  const { precioFinal } = motor.calcular({
    costoItem: 100,
    porcentajeImportacion: 20,
    margenGanancia: -10,
    tasaImpuesto: 13,
  });

  assert.equal(precioFinal, 122.04);
});

test("coincide con el Excel del cliente: redondea solo al final", () => {
  // God of War Ragnarök: 49,99 con 20 % y 20 %. Si se redondeara en cada
  // paso daría 81,35; el Excel dice 81,34.
  const { precioFinal, desglose } = motor.calcular({
    costoItem: 49.99,
    porcentajeImportacion: 20,
    margenGanancia: 20,
    tasaImpuesto: 13,
  });

  assert.equal(precioFinal, 81.34);
  assert.deepEqual(desglose.map((paso) => paso.monto), [49.99, 59.99, 71.99, 81.34]);
});

test("el desglose permite verificar RNF-17 paso por paso", () => {
  const { desglose } = motor.calcular({
    costoItem: 1000,
    porcentajeImportacion: 0,
    margenGanancia: 0,
    tasaImpuesto: 13,
  });

  const impuesto = desglose.at(-1).monto - desglose.at(-2).monto;
  assert.equal(impuesto, 130);
});

test("la tasa de impuesto sale de cada producto", () => {
  const conImpuesto = motor.calcular({ costoItem: 100, tasaImpuesto: 13 });
  const exento = motor.calcular({ costoItem: 100, tasaImpuesto: 0 });

  assert.equal(conImpuesto.precioFinal, 113);
  assert.equal(exento.precioFinal, 100);
});

test("el motor exige al menos un paso", () => {
  assert.throws(() => new MotorDePrecios([]), /al menos un paso/);
});

// Test del motor de precios hecho con la ayuda de Claude
