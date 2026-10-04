import test from "node:test";
import assert from "node:assert/strict";

import { validarCambiosDeProducto } from "./validar-cambios-de-producto.js";
import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";

/** Campos marcados como malos, o [] si los cambios pasan. */
function camposConProblemas(datos) {
  try {
    validarCambiosDeProducto(datos);
    return [];
  } catch (error) {
    assert.ok(error instanceof EntradaInvalida);
    return error.detalles.campos;
  }
}

test("acepta un solo campo y devuelve solo ese", () => {
  assert.deepEqual(validarCambiosDeProducto({ margenGanancia: 30 }), { margenGanancia: 30 });
});

test("acepta dos campos", () => {
  assert.deepEqual(validarCambiosDeProducto({ costoItem: 1000, porcentajeImportacion: 20 }), {
    costoItem: 1000,
    porcentajeImportacion: 20,
  });
});

test("acepta los tres campos", () => {
  assert.deepEqual(validarCambiosDeProducto({ costoItem: 1000, porcentajeImportacion: 20, margenGanancia: 25 }), {
    costoItem: 1000,
    porcentajeImportacion: 20,
    margenGanancia: 25,
  });
});

test("acepta los números como texto, como los manda el modal", () => {
  assert.deepEqual(validarCambiosDeProducto({ costoItem: "12.5", porcentajeImportacion: " 20 ", margenGanancia: "-10" }), {
    costoItem: 12.5,
    porcentajeImportacion: 20,
    margenGanancia: -10,
  });
});

test("un cuerpo vacío se rechaza y marca todos los campos", () => {
  assert.deepEqual(camposConProblemas({}), [
    "costoItem",
    "porcentajeImportacion",
    "margenGanancia",
    "existencias",
    "admiteContrapedido",
  ]);
});

test("un cuerpo que no es un objeto se rechaza", () => {
  for (const datos of [null, undefined, "texto", 12, [], [{ costoItem: 1000 }]]) {
    assert.throws(() => validarCambiosDeProducto(datos), EntradaInvalida);
  }
});

test("rechaza las claves que no son de precio y las nombra", () => {
  assert.deepEqual(camposConProblemas({ costoItem: 1000, precioFinal: 5000 }), ["precioFinal"]);
  assert.deepEqual(camposConProblemas({ margenGanancia: 25, nombre: "Otro", costoTotal: 1200 }), ["nombre", "costoTotal"]);
});

test("solo claves no permitidas: las nombra y pide al menos un campo", () => {
  assert.deepEqual(camposConProblemas({ precioFinal: 5000 }), [
    "precioFinal",
    "costoItem",
    "porcentajeImportacion",
    "margenGanancia",
    "existencias",
    "admiteContrapedido",
  ]);
});

test("un campo presente pero vacío es un error, no 'dejarlo igual'", () => {
  for (const vacio of [null, "", "   "]) {
    assert.deepEqual(camposConProblemas({ costoItem: vacio }), ["costoItem"]);
    assert.deepEqual(camposConProblemas({ porcentajeImportacion: vacio }), ["porcentajeImportacion"]);
    assert.deepEqual(camposConProblemas({ margenGanancia: vacio }), ["margenGanancia"]);
    assert.deepEqual(camposConProblemas({ existencias: vacio }), ["existencias"]);
  }
  assert.deepEqual(camposConProblemas({ admiteContrapedido: null }), ["admiteContrapedido"]);
});

test("los mensajes de un campo vacío", () => {
  assert.throws(
    () => validarCambiosDeProducto({ costoItem: null, porcentajeImportacion: "", margenGanancia: null }),
    {
      message: "El costo es obligatorio. El porcentaje de importación es obligatorio. El margen es obligatorio.",
    }
  );
});

test("rechaza costo e importación negativos, con los mismos mensajes que al crear", () => {
  assert.throws(() => validarCambiosDeProducto({ costoItem: -1 }), { message: "El costo no puede ser negativo." });
  assert.throws(() => validarCambiosDeProducto({ porcentajeImportacion: -5 }), {
    message: "El porcentaje de importación tiene que ser un número de 0 o más.",
  });
});

test("RN-02: el margen tiene que ser mayor que -100 %", () => {
  assert.deepEqual(camposConProblemas({ margenGanancia: -100 }), ["margenGanancia"]);
  assert.deepEqual(camposConProblemas({ margenGanancia: "-100.01" }), ["margenGanancia"]);
  assert.deepEqual(validarCambiosDeProducto({ margenGanancia: -99.99 }), { margenGanancia: -99.99 });
});

test("rechaza valores que no son números o que pasan el límite de la columna", () => {
  assert.deepEqual(camposConProblemas({ costoItem: "mucho" }), ["costoItem"]);
  assert.deepEqual(camposConProblemas({ costoItem: true }), ["costoItem"]);
  assert.deepEqual(camposConProblemas({ costoItem: 10_000_000_000 }), ["costoItem"]);
  assert.deepEqual(camposConProblemas({ porcentajeImportacion: 10_000 }), ["porcentajeImportacion"]);
  assert.deepEqual(camposConProblemas({ margenGanancia: 10_000 }), ["margenGanancia"]);
});

test("junta todos los problemas en un solo error", () => {
  assert.throws(
    () => validarCambiosDeProducto({ costoItem: -1, porcentajeImportacion: "abc", margenGanancia: -100, precioFinal: 1 }),
    (error) => {
      assert.ok(error instanceof EntradaInvalida);
      assert.deepEqual(error.detalles.campos, ["precioFinal", "costoItem", "porcentajeImportacion", "margenGanancia"]);
      return true;
    }
  );
});

test("acepta existencias y contrapedido solos, sin tocar el precio", () => {
  assert.deepEqual(validarCambiosDeProducto({ existencias: "7" }), { existencias: 7 });
  assert.deepEqual(validarCambiosDeProducto({ admiteContrapedido: false }), { admiteContrapedido: false });
  assert.deepEqual(validarCambiosDeProducto({ existencias: 0, admiteContrapedido: true, margenGanancia: 30 }), {
    margenGanancia: 30,
    existencias: 0,
    admiteContrapedido: true,
  });
});

test("las existencias tienen que ser un entero de 0 o más", () => {
  for (const existencias of [-1, "2.5", "muchas", 2_147_483_648]) {
    assert.deepEqual(camposConProblemas({ existencias }), ["existencias"]);
  }
  assert.throws(() => validarCambiosDeProducto({ existencias: -1 }), {
    message: "Las existencias tienen que ser un número entero de 0 o más.",
  });
});

test("el contrapedido tiene que ser true o false", () => {
  for (const admiteContrapedido of ["sí", "true", 1, ""]) {
    assert.deepEqual(camposConProblemas({ admiteContrapedido }), ["admiteContrapedido"]);
  }
});
