import test from "node:test";
import assert from "node:assert/strict";

import { conValoresDeLaFamilia } from "./herencia-de-familia.js";

const familia = { porcentajeImportacion: 10, margenGanancia: 50 };

test("sin valores propios usa los de la familia y lo marca como heredado", () => {
  const producto = conValoresDeLaFamilia({ porcentajeImportacion: null, margenGanancia: null, familia });

  assert.equal(producto.porcentajeImportacion, 10);
  assert.equal(producto.margenGanancia, 50);
  assert.deepEqual(producto.heredado, { porcentajeImportacion: true, margenGanancia: true });
});

test("un valor propio sobrescribe el de la familia, aunque sea 0", () => {
  const producto = conValoresDeLaFamilia({ porcentajeImportacion: 0, margenGanancia: -10, familia });

  assert.equal(producto.porcentajeImportacion, 0);
  assert.equal(producto.margenGanancia, -10);
  assert.deepEqual(producto.heredado, { porcentajeImportacion: false, margenGanancia: false });
});

test("puede heredar un campo y sobrescribir el otro", () => {
  const producto = conValoresDeLaFamilia({ porcentajeImportacion: 20, margenGanancia: null, familia });

  assert.equal(producto.porcentajeImportacion, 20);
  assert.equal(producto.margenGanancia, 50);
  assert.deepEqual(producto.heredado, { porcentajeImportacion: false, margenGanancia: true });
});

test("no cambia el producto que recibe", () => {
  const guardado = { porcentajeImportacion: null, margenGanancia: null, familia };
  conValoresDeLaFamilia(guardado);

  assert.equal(guardado.porcentajeImportacion, null);
});
