import test from "node:test";
import assert from "node:assert/strict";

import { validarEntrega, totalConEntrega } from "./modalidades-de-entrega.js";
import { EntradaInvalida } from "../../../shared/errores/errores-de-dominio.js";

test("una modalidad con envío exige la dirección y la limpia", () => {
  assert.deepEqual(validarEntrega({ modalidadEntrega: "mensajero", direccion: "  San Pedro, 200 m norte " }), {
    modalidadEntrega: "mensajero",
    direccion: "San Pedro, 200 m norte",
  });
});

test("sin dirección, una modalidad con envío se rechaza en el campo direccion", () => {
  for (const modalidadEntrega of ["mensajero", "uber_flash", "correos_cr"]) {
    assert.throws(() => validarEntrega({ modalidadEntrega, direccion: "  " }), (error) => {
      assert.ok(error instanceof EntradaInvalida);
      assert.deepEqual(error.detalles.campos, ["direccion"]);
      return true;
    });
  }
});

test("la entrega personal no exige dirección y no la guarda", () => {
  assert.deepEqual(validarEntrega({ modalidadEntrega: "entrega_personal" }), {
    modalidadEntrega: "entrega_personal",
    direccion: null,
  });
  assert.equal(validarEntrega({ modalidadEntrega: "entrega_personal", direccion: "Heredia" }).direccion, null);
});

test("una modalidad que no existe se rechaza en el campo modalidadEntrega", () => {
  for (const modalidadEntrega of [undefined, "dron", ""]) {
    assert.throws(() => validarEntrega({ modalidadEntrega, direccion: "Heredia" }), (error) => {
      assert.deepEqual(error.detalles.campos, ["modalidadEntrega"]);
      return true;
    });
  }
});

test("RN-16: el costo de entrega se suma al total", () => {
  assert.equal(totalConEntrega({ subtotal: 100, impuesto: 13, costoEntrega: 3.5 }), 116.5);
  assert.equal(totalConEntrega({ subtotal: 49.99, impuesto: 6.4987, costoEntrega: 0 }), 56.49);
});
