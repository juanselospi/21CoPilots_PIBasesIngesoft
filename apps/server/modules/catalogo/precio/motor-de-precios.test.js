import test from "node:test";
import assert from "node:assert/strict";

import { MotorDePrecios } from "./motor-de-precios.js";
import { ImportacionPorAranceles } from "./pasos/importacion-por-aranceles.js";
import { MargenDeGanancia } from "./pasos/margen-de-ganancia.js";
import { ImpuestoDeVenta } from "./pasos/impuesto-de-venta.js";

const motor = new MotorDePrecios([
  new ImportacionPorAranceles(),
  new MargenDeGanancia(),
  new ImpuestoDeVenta(0.13),
]);

test("RN-01: aplica importación, margen e impuesto en ese orden", () => {
  const { precioFinal, desglose } = motor.calcular({
    costoItem: 100,
    porcentajeImportacion: 20,
    margenGanancia: 50,
  });

  // 100 → 120 (aranceles) → 180 (margen) → 203,4 (impuesto)
  assert.equal(precioFinal, 203);
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
  });

  assert.equal(precioFinal, 90); // 80 + 13 %
});

test("el desglose permite verificar RNF-17 paso por paso", () => {
  const { desglose } = motor.calcular({
    costoItem: 1000,
    porcentajeImportacion: 0,
    margenGanancia: 0,
  });

  const impuesto = desglose.at(-1).monto - desglose.at(-2).monto;
  assert.equal(impuesto, 130);
});

test("el motor exige al menos un paso", () => {
  assert.throws(() => new MotorDePrecios([]), /al menos un paso/);
});
