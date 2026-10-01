import test from "node:test";
import assert from "node:assert/strict";

import { CatalogoService } from "./catalogo.service.js";
import { MotorDePrecios } from "./precio/motor-de-precios.js";
import { ImportacionPorAranceles } from "./precio/pasos/importacion-por-aranceles.js";
import { MargenDeGanancia } from "./precio/pasos/margen-de-ganancia.js";
import { ImpuestoDeVenta } from "./precio/pasos/impuesto-de-venta.js";
import { EntradaInvalida, ReglaDeNegocioViolada } from "../../shared/errores/errores-de-dominio.js";

const motorDePrecios = new MotorDePrecios([
  new ImportacionPorAranceles(),
  new MargenDeGanancia(),
  new ImpuestoDeVenta(),
]);

// Base falsa: guarda los productos por SKU y, como la real, no deja
// guardar dos con el mismo código. Llenan stock y tasa con sus valores
// por defecto (0 y 13 %).
function crearServicio() {
  const productos = new Map();

  const repositorio = {
    crear: async (producto) => {
      if (productos.has(producto.sku)) return null;
      productos.set(producto.sku, { ...producto, existencias: 0, tasaImpuesto: 13 });
      return producto.sku;
    },
    obtenerPorSku: async (sku) => productos.get(sku) ?? null,
  };

  return { servicio: new CatalogoService({ repositorio, motorDePrecios }), productos };
}

const pkm001 = {
  sku: "PKM-001",
  nombre: "Sobre Pokémon TCG Escarlata y Púrpura",
  categoria: "Trading Cards",
  costoItem: 100,
  porcentajeImportacion: 20,
  margenGanancia: 25,
};

test("registra el producto y lo devuelve con su precio calculado", async () => {
  const { servicio } = crearServicio();

  const producto = await servicio.crearProducto(pkm001);

  assert.equal(producto.sku, "PKM-001");
  assert.equal(producto.precioFinal, 169.5);
  assert.equal(producto.existencias, 0);
});

test("RF-01: registrar PKM-001 dos veces da error la segunda vez", async () => {
  const { servicio, productos } = crearServicio();
  await servicio.crearProducto(pkm001);

  await assert.rejects(servicio.crearProducto({ ...pkm001, sku: " pkm-001 " }), (error) => {
    assert.ok(error instanceof ReglaDeNegocioViolada);
    assert.equal(error.message, "Ya existe un producto con el código PKM-001.");
    return true;
  });
  assert.equal(productos.size, 1);
});

test("no guarda nada si los datos no son válidos", async () => {
  const { servicio, productos } = crearServicio();

  await assert.rejects(servicio.crearProducto({ ...pkm001, sku: "" }), EntradaInvalida);
  assert.equal(productos.size, 0);
});

// Catálogo falso para las categorías: un producto se ve si tiene
// existencias o admite contrapedido (RN-03).
function crearServicioConProductos(productos) {
  const repositorio = { listar: async () => productos };
  return new CatalogoService({ repositorio, motorDePrecios });
}

const producto = (sku, categoria, existencias, admiteContrapedido = false) => ({
  ...pkm001,
  sku,
  categoria,
  existencias,
  admiteContrapedido,
  tasaImpuesto: 13,
});

test("RN-03: las categorías solo cuentan los productos visibles", async () => {
  const servicio = crearServicioConProductos([
    producto("LEG-001", "Legos", 3),
    producto("LEG-002", "Legos", 0, true),
    producto("LEG-003", "Legos", 0),
    producto("PKM-001", "Trading Cards", 1),
  ]);

  assert.deepEqual(await servicio.listarCategorias(), [
    { nombre: "Legos", cantidadDeProductos: 2 },
    { nombre: "Trading Cards", cantidadDeProductos: 1 },
  ]);
});

test("RN-03: una categoría con todos sus productos ocultos no aparece", async () => {
  const servicio = crearServicioConProductos([
    producto("FUN-003", "Coleccionables", 0),
    producto("NSW-001", "Video Juegos", 2),
  ]);

  assert.deepEqual(await servicio.listarCategorias(), [
    { nombre: "Video Juegos", cantidadDeProductos: 1 },
  ]);
});
