import test from "node:test";
import assert from "node:assert/strict";

import { validarProductoNuevo } from "./validar-producto-nuevo.js";
import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";

const valido = {
  sku: "PKM-001",
  nombre: "Sobre Pokémon TCG Escarlata y Púrpura",
  categoria: "Trading Cards",
  costoItem: 4.49,
  porcentajeImportacion: 13,
  margenGanancia: 35,
};

/** Campos marcados como malos, o [] si los datos pasan. */
function camposConProblemas(datos) {
  try {
    validarProductoNuevo(datos);
    return [];
  } catch (error) {
    assert.ok(error instanceof EntradaInvalida);
    return error.detalles.campos;
  }
}

test("acepta un producto válido y completa los valores por defecto", () => {
  assert.deepEqual(validarProductoNuevo(valido), {
    ...valido,
    descripcion: null,
    proveedor: null,
    imagenUrl: null,
    existencias: 0,
    admiteContrapedido: false,
  });
});

test("acepta existencias y contrapedido al crear", () => {
  const producto = validarProductoNuevo({ ...valido, existencias: "5", admiteContrapedido: true });

  assert.equal(producto.existencias, 5);
  assert.equal(producto.admiteContrapedido, true);
});

test("RF-01: guarda el código en mayúsculas y sin espacios", () => {
  assert.equal(validarProductoNuevo({ ...valido, sku: "  pkm-001 " }).sku, "PKM-001");
});

test("acepta los números como texto, como los manda un formulario, y limpia los espacios", () => {
  const producto = validarProductoNuevo({ ...valido, costoItem: "4.49", margenGanancia: "-10", categoria: "  Trading Cards " });

  assert.equal(producto.costoItem, 4.49);
  assert.equal(producto.margenGanancia, -10);
  assert.equal(producto.categoria, "Trading Cards");
});

test("sin importación ni margen, los deja en 0", () => {
  const { porcentajeImportacion, margenGanancia } = validarProductoNuevo({
    ...valido,
    porcentajeImportacion: undefined,
    margenGanancia: "  ",
  });

  assert.equal(porcentajeImportacion, 0);
  assert.equal(margenGanancia, 0);
});

const CASOS_INVALIDOS = [
  ["código vacío", { sku: "   " }, "sku"],
  ["código de más de 50 caracteres", { sku: "X".repeat(51) }, "sku"],
  ["sin nombre", { nombre: "" }, "nombre"],
  ["sin categoría", { categoria: undefined }, "categoria"],
  ["categoría de más de 100 caracteres", { categoria: "X".repeat(101) }, "categoria"],
  ["sin costo", { costoItem: undefined }, "costoItem"],
  ["costo que no es número", { costoItem: "mucho" }, "costoItem"],
  ["costo negativo", { costoItem: -1 }, "costoItem"],
  ["importación negativa", { porcentajeImportacion: -5 }, "porcentajeImportacion"],
  ["margen de -100 %", { margenGanancia: -100 }, "margenGanancia"],
  ["existencias negativas", { existencias: -1 }, "existencias"],
  ["existencias con decimales", { existencias: "2.5" }, "existencias"],
  ["existencias que no son número", { existencias: "muchas" }, "existencias"],
  ["contrapedido que no es sí o no", { admiteContrapedido: "sí" }, "admiteContrapedido"],
  ["imagen que no es una dirección web", { imagenUrl: "foto.png" }, "imagenUrl"],
];

for (const [caso, cambios, campo] of CASOS_INVALIDOS) {
  test(`rechaza: ${caso}`, () => {
    assert.deepEqual(camposConProblemas({ ...valido, ...cambios }), [campo]);
  });
}

test("RN-02: acepta un margen negativo mayor que -100 %", () => {
  assert.deepEqual(camposConProblemas({ ...valido, margenGanancia: -10 }), []);
});

test("informa todos los campos malos de una vez", () => {
  assert.deepEqual(camposConProblemas({ nombre: "Algo" }), ["sku", "categoria", "costoItem"]);
});
