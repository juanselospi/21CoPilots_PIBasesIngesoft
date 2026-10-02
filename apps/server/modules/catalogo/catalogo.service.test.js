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

// Catálogo para el listado del panel. Sin importación y con 13 % de
// impuesto, los precios quedan en: ALF 101.7, BOO 169.5, FUN 226 y
// MIK = ZEL = 406.8 (empatan a propósito, igual que BOO y FUN en 0 unidades).
const paraElPanel = [
  { sku: "ZEL-001", nombre: "Zelda", costoItem: 300, margenGanancia: 20, existencias: 7, admiteContrapedido: false },
  { sku: "ALF-001", nombre: "Alfa", costoItem: 100, margenGanancia: -10, existencias: 6, admiteContrapedido: false },
  { sku: "FUN-001", nombre: "Funko oculto", costoItem: 200, margenGanancia: 0, existencias: 0, admiteContrapedido: false },
  { sku: "BOO-001", nombre: "Booster", costoItem: 150, margenGanancia: 0, existencias: 0, admiteContrapedido: true },
  { sku: "MIK-001", nombre: "Miku", costoItem: 300, margenGanancia: 20, existencias: 2, admiteContrapedido: true },
].map((producto) => ({ ...producto, porcentajeImportacion: 0, tasaImpuesto: 13 }));

// El repositorio falso devuelve siempre todo y guarda los filtros que
// recibió: buscar por texto, categoría y proveedor es trabajo del SQL.
function crearServicioDelPanel() {
  const consultas = [];
  const repositorio = {
    listarParaAdministracion: async (filtros) => {
      consultas.push(filtros);
      return paraElPanel;
    },
  };

  return { servicio: new CatalogoService({ repositorio, motorDePrecios }), consultas };
}

async function skusDelPanel(filtros) {
  const { servicio } = crearServicioDelPanel();
  const { productos } = await servicio.listarParaAdministracion({ limite: 24, ...filtros });
  return productos.map((producto) => producto.sku);
}

test("el listado del panel incluye el producto oculto en la tienda, con su desglose", async () => {
  const { servicio } = crearServicioDelPanel();

  const { productos, total } = await servicio.listarParaAdministracion({ limite: 24 });

  assert.equal(total, 5);
  assert.ok(productos.some((producto) => producto.sku === "FUN-001" && producto.disponibilidad === "no_disponible"));
  for (const producto of productos) {
    assert.deepEqual(
      producto.desglosePrecio.map(({ paso }) => paso),
      ["costo", "importacion", "margen", "impuesto"]
    );
  }
});

test("el término, la categoría y el proveedor se le piden al repositorio", async () => {
  const { servicio, consultas } = crearServicioDelPanel();

  await servicio.listarParaAdministracion({ termino: "pkm", categoria: "Juguetes", proveedor: "Games Import", limite: 24 });

  assert.deepEqual(consultas, [{ termino: "pkm", categoria: "Juguetes", proveedor: "Games Import" }]);
});

test("filtra por cada estado de disponibilidad", async () => {
  assert.deepEqual(await skusDelPanel({ disponibilidad: "en_existencia" }), ["ALF-001", "MIK-001", "ZEL-001"]);
  assert.deepEqual(await skusDelPanel({ disponibilidad: "por_contrapedido" }), ["BOO-001"]);
  assert.deepEqual(await skusDelPanel({ disponibilidad: "no_disponible" }), ["FUN-001"]);
});

test("filtra por existencias bajas, y sin el filtro los devuelve todos", async () => {
  assert.deepEqual(await skusDelPanel({ existenciasBajas: true }), ["BOO-001", "FUN-001", "MIK-001"]);
  assert.equal((await skusDelPanel({ existenciasBajas: false })).length, 5);
});

test("RF-43: filtra por margen negativo", async () => {
  assert.deepEqual(await skusDelPanel({ margenNegativo: true }), ["ALF-001"]);
  assert.equal((await skusDelPanel({ margenNegativo: false })).length, 5);
});

test("filtra por rango de precio final, con los dos extremos incluidos", async () => {
  assert.deepEqual(await skusDelPanel({ precioMin: 169.5, precioMax: 226 }), ["BOO-001", "FUN-001"]);
  assert.deepEqual(await skusDelPanel({ precioMin: 226.01 }), ["MIK-001", "ZEL-001"]);
  assert.deepEqual(await skusDelPanel({ precioMax: 169.49 }), ["ALF-001"]);
});

test("los filtros se combinan", async () => {
  assert.deepEqual(
    await skusDelPanel({ existenciasBajas: true, disponibilidad: "en_existencia", precioMin: 400 }),
    ["MIK-001"]
  );
});

test("ordena por nombre si no se pide otro orden, y por cada valor de 'orden'", async () => {
  const porNombre = ["ALF-001", "BOO-001", "FUN-001", "MIK-001", "ZEL-001"];

  assert.deepEqual(await skusDelPanel({}), porNombre);
  assert.deepEqual(await skusDelPanel({ orden: "nombre" }), porNombre);
  assert.deepEqual(await skusDelPanel({ orden: "-nombre" }), [...porNombre].reverse());
  assert.deepEqual(await skusDelPanel({ orden: "precio" }), ["ALF-001", "BOO-001", "FUN-001", "MIK-001", "ZEL-001"]);
  assert.deepEqual(await skusDelPanel({ orden: "-precio" }), ["MIK-001", "ZEL-001", "FUN-001", "BOO-001", "ALF-001"]);
  assert.deepEqual(await skusDelPanel({ orden: "existencias" }), ["BOO-001", "FUN-001", "MIK-001", "ALF-001", "ZEL-001"]);
  assert.deepEqual(await skusDelPanel({ orden: "sku" }), ["ALF-001", "BOO-001", "FUN-001", "MIK-001", "ZEL-001"]);
});

test("los empates se resuelven por SKU, también con el orden invertido", async () => {
  const empatados = (skus) => skus.filter((sku) => sku === "MIK-001" || sku === "ZEL-001");

  // MIK-001 y ZEL-001 cuestan lo mismo.
  assert.deepEqual(empatados(await skusDelPanel({ orden: "precio" })), ["MIK-001", "ZEL-001"]);
  assert.deepEqual(empatados(await skusDelPanel({ orden: "-precio" })), ["MIK-001", "ZEL-001"]);
  // BOO-001 y FUN-001 tienen 0 unidades.
  assert.deepEqual((await skusDelPanel({ orden: "existencias" })).slice(0, 2), ["BOO-001", "FUN-001"]);
});

test("pagina después de filtrar y el total no depende de la página", async () => {
  const { servicio } = crearServicioDelPanel();
  const pagina = async (desplazamiento) => {
    const { productos, total } = await servicio.listarParaAdministracion({ limite: 2, desplazamiento });
    return { skus: productos.map((producto) => producto.sku), total };
  };

  assert.deepEqual(await pagina(0), { skus: ["ALF-001", "BOO-001"], total: 5 });
  assert.deepEqual(await pagina(2), { skus: ["FUN-001", "MIK-001"], total: 5 });
  assert.deepEqual(await pagina(4), { skus: ["ZEL-001"], total: 5 });
  assert.deepEqual(await pagina(6), { skus: [], total: 5 });
});

test("el total cuenta solo los productos que cumplen los filtros", async () => {
  const { servicio } = crearServicioDelPanel();

  const { productos, total } = await servicio.listarParaAdministracion({ existenciasBajas: true, limite: 2 });

  assert.equal(total, 3);
  assert.equal(productos.length, 2);
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
