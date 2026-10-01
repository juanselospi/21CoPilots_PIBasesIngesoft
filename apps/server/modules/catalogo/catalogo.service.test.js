import test from "node:test";
import assert from "node:assert/strict";

import { CatalogoService, calcularEtiquetas } from "./catalogo.service.js";
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

// Producto ya compuesto, sin ninguna etiqueta: con existencias de sobra,
// margen positivo y sin contrapedido.
const sinEtiquetas = {
  sku: "PKM-001",
  admiteContrapedido: false,
  margenGanancia: 25,
  existencias: 40,
  disponibilidad: "en_existencia",
};

test("un producto sin nada que avisar no lleva etiquetas", () => {
  assert.deepEqual(calcularEtiquetas(sinEtiquetas, 2), []);
});

test("etiqueta 'contrapedido' si el producto admite contrapedido", () => {
  assert.deepEqual(calcularEtiquetas({ ...sinEtiquetas, admiteContrapedido: true }, 2), ["contrapedido"]);
});

test("RF-43: etiqueta 'margen_negativo' solo si el margen es menor que 0", () => {
  assert.deepEqual(calcularEtiquetas({ ...sinEtiquetas, margenGanancia: -10 }, 2), ["margen_negativo"]);
  assert.deepEqual(calcularEtiquetas({ ...sinEtiquetas, margenGanancia: 0 }, 2), []);
});

test("etiqueta 'existencias_bajas' en el umbral o por debajo", () => {
  assert.deepEqual(calcularEtiquetas({ ...sinEtiquetas, existencias: 2 }, 2), ["existencias_bajas"]);
  assert.deepEqual(calcularEtiquetas({ ...sinEtiquetas, existencias: 3 }, 2), []);
  assert.deepEqual(calcularEtiquetas({ ...sinEtiquetas, existencias: 3 }, 5), ["existencias_bajas"]);
});

test("RN-03: etiqueta 'oculto_en_tienda' si el producto no está disponible", () => {
  const oculto = { ...sinEtiquetas, existencias: 0, disponibilidad: "no_disponible" };

  assert.deepEqual(calcularEtiquetas(oculto, 2), ["existencias_bajas", "oculto_en_tienda"]);
});

test("las etiquetas salen siempre en el mismo orden", () => {
  // No es un caso real (con contrapedido el producto no queda oculto):
  // solo comprueba el orden cuando aplican las cuatro.
  const conTodas = {
    ...sinEtiquetas,
    admiteContrapedido: true,
    margenGanancia: -10,
    existencias: 0,
    disponibilidad: "no_disponible",
  };

  assert.deepEqual(calcularEtiquetas(conTodas, 2), [
    "contrapedido",
    "margen_negativo",
    "existencias_bajas",
    "oculto_en_tienda",
  ]);
});

test("el producto recién registrado trae sus etiquetas", async () => {
  const { servicio } = crearServicio();

  // Nace con stock 0 y sin contrapedido.
  const producto = await servicio.crearProducto(pkm001);

  assert.deepEqual(producto.etiquetas, ["existencias_bajas", "oculto_en_tienda"]);
});
