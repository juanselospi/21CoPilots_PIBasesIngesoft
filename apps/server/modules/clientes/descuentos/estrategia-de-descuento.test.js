import test from "node:test";
import assert from "node:assert/strict";

import { DescuentoPorNivel } from "./estrategia-de-descuento.js";

// Misma escala que database/semillas/referencia/01_niveles_fidelidad.sql
const escala = [
  { nivel: 1, comprasMinimas: 0, porcentajeDescuento: 0 },
  { nivel: 2, comprasMinimas: 1, porcentajeDescuento: 5 },
  { nivel: 3, comprasMinimas: 2, porcentajeDescuento: 10 },
  { nivel: 4, comprasMinimas: 4, porcentajeDescuento: 15 },
];

const estrategia = new DescuentoPorNivel({ escala, montoMinimo: 100000 });

test("RN-08: el nivel se deriva de la cantidad de compras", () => {
  assert.equal(estrategia.nivelDe(0).nivel, 1);
  assert.equal(estrategia.nivelDe(1).nivel, 2);
  assert.equal(estrategia.nivelDe(3).nivel, 3);
  assert.equal(estrategia.nivelDe(10).nivel, 4);
});

test("RN-09: el descuento aplica solo sobre el monto mínimo", () => {
  assert.equal(estrategia.calcular(100000, { numCompras: 4 }).monto, 0);
  assert.equal(estrategia.calcular(200000, { numCompras: 4 }).monto, 30000);
});

test("la escala es obligatoria: no hay valores escritos en el código", () => {
  assert.throws(() => new DescuentoPorNivel({ escala: [], montoMinimo: 0 }));
});
