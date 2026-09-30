import test from "node:test";
import assert from "node:assert/strict";

import { CatalogoService, DISPONIBILIDAD } from "./catalogo.service.js";
import { MotorDePrecios } from "./precio/motor-de-precios.js";
import { ImportacionPorAranceles } from "./precio/pasos/importacion-por-aranceles.js";
import { MargenDeGanancia } from "./precio/pasos/margen-de-ganancia.js";
import { ImpuestoDeVenta } from "./precio/pasos/impuesto-de-venta.js";
import { RecursoNoEncontrado } from "../../shared/errores/errores-de-dominio.js";

const producto = (sku, categoria, existencias, admiteContrapedido) => ({
  sku,
  nombre: `Producto ${sku}`,
  categoria,
  costoItem: 100,
  porcentajeImportacion: 20,
  margenGanancia: 50,
  existencias,
  admiteContrapedido,
});

/** Repositorio en memoria con los tres casos de RN-03. */
function crearServicio() {
  const productos = [
    producto("CON-001", "Juguetes", 5, false),        // en existencia
    producto("CTR-001", "Juguetes", 0, true),         // por contrapedido
    producto("OCU-001", "Coleccionables", 0, false),  // oculto
  ];
  const repositorio = {
    async listar({ categoria = null } = {}) {
      return productos.filter((p) => categoria === null || p.categoria === categoria);
    },
    async obtenerPorSku(sku) {
      return productos.find((p) => p.sku === sku.trim().toUpperCase()) ?? null;
    },
  };
  const motorDePrecios = new MotorDePrecios([
    new ImportacionPorAranceles(),
    new MargenDeGanancia(),
    new ImpuestoDeVenta(0.13),
  ]);
  return new CatalogoService({ repositorio, motorDePrecios });
}

test("RN-03: el catálogo oculta lo que no tiene stock ni admite contrapedido", async () => {
  const servicio = crearServicio();

  const productos = await servicio.listarCatalogo({ limite: 24, desplazamiento: 0 });

  assert.deepEqual(
    productos.map((p) => [p.sku, p.disponibilidad]),
    [
      ["CON-001", DISPONIBILIDAD.EN_EXISTENCIA],
      ["CTR-001", DISPONIBILIDAD.POR_CONTRAPEDIDO],
    ]
  );
});

test("el precio final lo calcula el motor con el 13 % fijo (formula-precio.md)", async () => {
  const servicio = crearServicio();

  const ficha = await servicio.obtenerFicha("CON-001");

  // 100 → 120 (importación) → 180 (margen) → 203,4 (impuesto)
  assert.equal(ficha.precioFinal, 203);
});

test("la ficha se busca por SKU, sin importar mayúsculas ni espacios", async () => {
  const servicio = crearServicio();

  const ficha = await servicio.obtenerFicha(" con-001 ");
  assert.equal(ficha.sku, "CON-001");
});

test("RN-03: la ficha de un producto oculto responde como inexistente", async () => {
  const servicio = crearServicio();

  await assert.rejects(servicio.obtenerFicha("OCU-001"), RecursoNoEncontrado);
  await assert.rejects(servicio.obtenerFicha("NO-EXISTE"), RecursoNoEncontrado);
});

test("pagina con límite y desplazamiento", async () => {
  const servicio = crearServicio();

  const segundaPagina = await servicio.listarCatalogo({ limite: 1, desplazamiento: 1 });
  assert.deepEqual(segundaPagina.map((p) => p.sku), ["CTR-001"]);
});

test("las categorías salen de los productos y cuentan solo los visibles", async () => {
  const servicio = crearServicio();

  assert.deepEqual(await servicio.listarCategorias(), [
    { nombre: "Coleccionables", cantidadDeProductos: 0 },
    { nombre: "Juguetes", cantidadDeProductos: 2 },
  ]);
});
