import test from "node:test";
import assert from "node:assert/strict";

import { validarFamiliaNueva, validarCambiosDeFamilia } from "./validar-familia.js";
import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";

/** Campos marcados como malos, o [] si los datos pasan. */
function camposConProblemas(validar, datos) {
  try {
    validar(datos);
    return [];
  } catch (error) {
    assert.ok(error instanceof EntradaInvalida);
    return error.detalles.campos;
  }
}

test("una familia nueva solo exige el nombre; importación y margen valen 0", () => {
  assert.deepEqual(validarFamiliaNueva({ nombre: "Funkos" }), {
    nombre: "Funkos",
    descripcion: null,
    porcentajeImportacion: 0,
    margenGanancia: 0,
  });
});

test("normaliza los espacios del nombre y acepta números como texto", () => {
  const familia = validarFamiliaNueva({ nombre: "  Trading   Cards ", porcentajeImportacion: "13", margenGanancia: "-5" });

  assert.equal(familia.nombre, "Trading Cards");
  assert.equal(familia.porcentajeImportacion, 13);
  assert.equal(familia.margenGanancia, -5);
});

test("una familia nueva informa todos los campos malos a la vez", () => {
  assert.deepEqual(camposConProblemas(validarFamiliaNueva, { nombre: " ", porcentajeImportacion: -1, margenGanancia: -100 }), [
    "nombre",
    "porcentajeImportacion",
    "margenGanancia",
  ]);
});

test("el nombre no puede pasar de 100 caracteres", () => {
  assert.deepEqual(camposConProblemas(validarFamiliaNueva, { nombre: "X".repeat(101) }), ["nombre"]);
});

test("los cambios devuelven solo lo que vino", () => {
  assert.deepEqual(validarCambiosDeFamilia({ margenGanancia: "30", activa: false }), { margenGanancia: 30, activa: false });
});

test("una descripción vacía borra la que había", () => {
  assert.deepEqual(validarCambiosDeFamilia({ descripcion: "  " }), { descripcion: null });
});

const CAMBIOS_INVALIDOS = [
  ["cuerpo vacío", {}, ["nombre", "descripcion", "porcentajeImportacion", "margenGanancia", "activa"]],
  ["un campo que no se puede cambiar", { margenGanancia: 10, totalDeProductos: 3 }, ["totalDeProductos"]],
  ["nombre vacío", { nombre: "" }, ["nombre"]],
  ["margen vacío", { margenGanancia: "" }, ["margenGanancia"]],
  ["importación negativa", { porcentajeImportacion: -1 }, ["porcentajeImportacion"]],
  ["activa como texto", { activa: "no" }, ["activa"]],
];

for (const [caso, datos, campos] of CAMBIOS_INVALIDOS) {
  test(`rechaza el cambio: ${caso}`, () => {
    assert.deepEqual(camposConProblemas(validarCambiosDeFamilia, datos), campos);
  });
}

test("un cuerpo que no es un objeto se rechaza", () => {
  for (const datos of [null, "texto", []]) {
    assert.throws(() => validarCambiosDeFamilia(datos), EntradaInvalida);
  }
});
