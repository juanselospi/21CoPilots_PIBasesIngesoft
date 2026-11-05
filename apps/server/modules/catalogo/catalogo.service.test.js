import test from "node:test";
import assert from "node:assert/strict";

import { CatalogoService, calcularEtiquetas } from "./catalogo.service.js";
import { MotorDePrecios } from "./precio/motor-de-precios.js";
import { ImportacionPorAranceles } from "./precio/pasos/importacion-por-aranceles.js";
import { MargenDeGanancia } from "./precio/pasos/margen-de-ganancia.js";
import { ImpuestoDeVenta } from "./precio/pasos/impuesto-de-venta.js";
import {
  EntradaInvalida,
  ProductoConHistorial,
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
} from "../../shared/errores/errores-de-dominio.js";

const motorDePrecios = new MotorDePrecios([
  new ImportacionPorAranceles(),
  new MargenDeGanancia(),
  new ImpuestoDeVenta(),
]);

// Base falsa: guarda los productos por SKU y, como la real, no deja
// guardar dos con el mismo código. Llena el estado y la tasa con sus
// valores por defecto (activo y 13 %).
function crearServicio() {
  const productos = new Map();

  const repositorio = {
    crear: async (producto) => {
      if (productos.has(producto.sku)) return null;
      productos.set(producto.sku, { estado: "activo", ...producto, tasaImpuesto: 13 });
      return producto.sku;
    },
    obtenerPorSku: async (sku) => productos.get(sku) ?? null,
    // Existen todas las familias salvo "Sin familia", y se guardan con mayúscula inicial
    buscarFamilia: async (nombre) =>
      nombre === "Sin familia" ? null : { nombre: nombre[0].toUpperCase() + nombre.slice(1) },
    // Como el UPDATE: cambia solo lo que viene, también a null.
    actualizar: async (sku, cambios) => {
      const producto = productos.get(sku);
      if (!producto) return null;
      productos.set(sku, { ...producto, ...cambios });
      return sku;
    },
  };

  const eventos = [];
  const busDeEventos = { publicar: async (evento, datos) => eventos.push({ evento, datos }) };

  // Como inventario: deja las existencias en el número pedido
  const fijarExistencias = async (sku, existencias) => {
    productos.set(sku, { ...productos.get(sku), existencias });
  };

  return {
    servicio: new CatalogoService({ repositorio, motorDePrecios, busDeEventos, fijarExistencias }),
    productos,
    eventos,
  };
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

test("RF-03, RF-04, RF-05: con costo 1000, importación 20 y margen 25 el precio final es 1695", async () => {
  const { servicio } = crearServicio();
  await servicio.crearProducto(pkm001);

  const producto = await servicio.actualizarProducto("PKM-001", {
    costoItem: 1000,
    porcentajeImportacion: 20,
    margenGanancia: 25,
  });

  assert.equal(producto.precioFinal, 1695);
  assert.deepEqual(producto.desglosePrecio, [
    { paso: "costo", monto: 1000 },
    { paso: "importacion", monto: 1200 },
    { paso: "margen", monto: 1500 },
    { paso: "impuesto", monto: 1695 },
  ]);
});

test("un cambio parcial conserva los otros dos campos", async () => {
  const { servicio, productos } = crearServicio();
  await servicio.crearProducto(pkm001);

  const producto = await servicio.actualizarProducto("PKM-001", { margenGanancia: "30" });

  assert.equal(producto.costoItem, 100);
  assert.equal(producto.porcentajeImportacion, 20);
  assert.equal(producto.margenGanancia, 30);
  assert.equal(productos.get("PKM-001").margenGanancia, 30);
});

test("editar el precio de un SKU que no existe da RecursoNoEncontrado", async () => {
  const { servicio } = crearServicio();

  await assert.rejects(servicio.actualizarProducto("NO-EXISTE", { costoItem: 1000 }), RecursoNoEncontrado);
});

test("no cambia nada si los cambios no son válidos", async () => {
  const { servicio, productos } = crearServicio();
  await servicio.crearProducto(pkm001);

  await assert.rejects(servicio.actualizarProducto("PKM-001", { costoItem: -1, margenGanancia: 30 }), EntradaInvalida);
  assert.equal(productos.get("PKM-001").costoItem, 100);
  assert.equal(productos.get("PKM-001").margenGanancia, 25);
});

test("RN-03: el administrador sí puede editar un producto oculto en la tienda", async () => {
  const { servicio } = crearServicio();
  // Nace con stock 0 y sin contrapedido: la tienda no lo muestra.
  await servicio.crearProducto(pkm001);
  await assert.rejects(servicio.obtenerFicha("PKM-001"), RecursoNoEncontrado);

  const producto = await servicio.actualizarProducto("PKM-001", { costoItem: 1000 });

  assert.equal(producto.disponibilidad, "no_disponible");
  assert.equal(producto.costoItem, 1000);
});

test("RN-03: un producto creado con existencias o con contrapedido se ve en la tienda", async () => {
  const { servicio } = crearServicio();
  await servicio.crearProducto({ ...pkm001, existencias: 3 });
  await servicio.crearProducto({ ...pkm001, sku: "PKM-002", admiteContrapedido: true });

  assert.equal((await servicio.obtenerFicha("PKM-001")).disponibilidad, "en_existencia");
  assert.equal((await servicio.obtenerFicha("PKM-002")).disponibilidad, "por_contrapedido");
});

test("RN-03: editar existencias y contrapedido cambia la disponibilidad", async () => {
  const { servicio } = crearServicio();
  await servicio.crearProducto(pkm001);

  const conExistencias = await servicio.actualizarProducto("PKM-001", { existencias: "4" });
  assert.equal(conExistencias.existencias, 4);
  assert.equal(conExistencias.disponibilidad, "en_existencia");
  assert.equal(conExistencias.costoItem, 100);

  const agotado = await servicio.actualizarProducto("PKM-001", { existencias: 0, admiteContrapedido: true });
  assert.equal(agotado.disponibilidad, "por_contrapedido");
  assert.ok(agotado.etiquetas.includes("contrapedido"));

  const oculto = await servicio.actualizarProducto("PKM-001", { admiteContrapedido: false });
  assert.equal(oculto.disponibilidad, "no_disponible");
  await assert.rejects(servicio.obtenerFicha("PKM-001"), RecursoNoEncontrado);
});

test("RN-02: un margen negativo válido agrega la etiqueta 'margen_negativo'", async () => {
  const { servicio } = crearServicio();
  await servicio.crearProducto(pkm001);

  const producto = await servicio.actualizarProducto("PKM-001", { margenGanancia: -10 });

  assert.ok(producto.etiquetas.includes("margen_negativo"));
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

test("un producto descontinuado no lleva 'existencias_bajas' aunque tenga poco stock", () => {
  const descontinuado = { ...sinEtiquetas, existencias: 0, disponibilidad: "descontinuado" };

  assert.deepEqual(calcularEtiquetas(descontinuado, 2), ["oculto_en_tienda", "descontinuado"]);
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
// existencias o admite contrapedido.
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

test("las categorías solo cuentan los productos visibles", async () => {
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

test("una categoría con todos sus productos ocultos no aparece", async () => {
  const servicio = crearServicioConProductos([
    producto("FUN-003", "Coleccionables", 0),
    producto("NSW-001", "Video Juegos", 2),
  ]);

  assert.deepEqual(await servicio.listarCategorias(), [
    { nombre: "Video Juegos", cantidadDeProductos: 1 },
  ]);
});

// Familia Legos: 20 % de importación y 50 % de margen.
const legos = { porcentajeImportacion: 20, margenGanancia: 50 };

test("un producto sin valores propios toma la importación y el margen de su familia", async () => {
  const servicio = crearServicioConProductos([
    { ...producto("LEG-001", "Legos", 3), porcentajeImportacion: null, margenGanancia: null, familia: legos },
  ]);

  const [leg001] = await servicio.listarCatalogo({ limite: 10, desplazamiento: 0 });

  // 100 → 120 → 180 → 203,40
  assert.equal(leg001.precioFinal, 203.4);
  assert.equal(leg001.porcentajeImportacion, 20);
  assert.equal(leg001.margenGanancia, 50);
  assert.deepEqual(leg001.heredado, { porcentajeImportacion: true, margenGanancia: true });
});

test("un margen propio sobrescribe el de la familia y la importación se sigue heredando", async () => {
  const servicio = crearServicioConProductos([
    { ...producto("LEG-002", "Legos", 3), porcentajeImportacion: null, margenGanancia: 25, familia: legos },
  ]);

  const [leg002] = await servicio.listarCatalogo({ limite: 10, desplazamiento: 0 });

  // 100 → 120 → 150 → 169,50
  assert.equal(leg002.precioFinal, 169.5);
  assert.deepEqual(leg002.heredado, { porcentajeImportacion: true, margenGanancia: false });
});

test("un margen negativo heredado de la familia también lleva la etiqueta", async () => {
  const repositorio = {
    listarParaAdministracion: async () => [
      {
        ...producto("LEG-003", "Legos", 3),
        porcentajeImportacion: null,
        margenGanancia: null,
        familia: { porcentajeImportacion: 0, margenGanancia: -10 },
      },
    ],
  };
  const servicio = new CatalogoService({ repositorio, motorDePrecios });

  const { productos } = await servicio.listarParaAdministracion({ limite: 24 });

  assert.ok(productos[0].etiquetas.includes("margen_negativo"));
});

test("no registra un producto de una familia que no existe", async () => {
  const { servicio, productos } = crearServicio();

  await assert.rejects(servicio.crearProducto({ ...pkm001, categoria: "Sin familia" }), (error) => {
    assert.ok(error instanceof EntradaInvalida);
    assert.deepEqual(error.detalles.campos, ["categoria"]);
    return true;
  });
  assert.equal(productos.size, 0);
});

test("el producto nuevo se guarda con el nombre de la familia como está guardado", async () => {
  const { servicio } = crearServicio();

  const producto = await servicio.crearProducto({ ...pkm001, categoria: "trading Cards" });

  assert.equal(producto.categoria, "Trading Cards");
});

test("una familia inactiva saca sus productos de la tienda y los marca ocultos en el panel", async () => {
  const inactiva = { porcentajeImportacion: 0, margenGanancia: 0, activa: false };
  const productos = [
    { ...producto("LEG-001", "Legos", 3), familia: inactiva },
    producto("PKM-001", "Trading Cards", 3),
  ];
  const repositorio = {
    listar: async () => productos,
    listarParaAdministracion: async () => productos,
    obtenerPorSku: async (sku) => productos.find((p) => p.sku === sku),
  };
  const servicio = new CatalogoService({ repositorio, motorDePrecios });

  const tienda = await servicio.listarCatalogo({ limite: 10, desplazamiento: 0 });
  assert.deepEqual(tienda.map((p) => p.sku), ["PKM-001"]);
  await assert.rejects(servicio.obtenerFicha("LEG-001"), RecursoNoEncontrado);
  assert.deepEqual(await servicio.listarFamilias(), [{ nombre: "Trading Cards", cantidadDeProductos: 1 }]);

  const { productos: panel } = await servicio.listarParaAdministracion({ limite: 24 });
  assert.ok(panel.find((p) => p.sku === "LEG-001").etiquetas.includes("oculto_en_tienda"));
});

// Editar datos generales

test("cambia el nombre, la descripción y el proveedor del producto", async () => {
  const { servicio } = crearServicio();
  await servicio.crearProducto(pkm001);

  const producto = await servicio.actualizarProducto("PKM-001", {
    nombre: "Sobre Pokémon 151",
    descripcion: "Expansión 151",
    proveedor: "Distribuidora TCG",
  });

  assert.equal(producto.nombre, "Sobre Pokémon 151");
  assert.equal(producto.descripcion, "Expansión 151");
  assert.equal(producto.proveedor, "Distribuidora TCG");
});

test("mueve el producto a otra familia con el nombre como está guardado", async () => {
  const { servicio } = crearServicio();
  await servicio.crearProducto(pkm001);

  const producto = await servicio.actualizarProducto("PKM-001", { categoria: "coleccionables" });

  assert.equal(producto.categoria, "Coleccionables");
});

test("no mueve el producto a una familia que no existe", async () => {
  const { servicio, productos } = crearServicio();
  await servicio.crearProducto(pkm001);

  await assert.rejects(servicio.actualizarProducto("PKM-001", { categoria: "Sin familia" }), EntradaInvalida);
  assert.equal(productos.get("PKM-001").categoria, "Trading Cards");
});

test("null en el margen hace que el producto vuelva a usar el de su familia", async () => {
  const { servicio, productos } = crearServicio();
  await servicio.crearProducto(pkm001);
  productos.get("PKM-001").familia = { porcentajeImportacion: 0, margenGanancia: 50 };

  const producto = await servicio.actualizarProducto("PKM-001", { margenGanancia: null });

  assert.equal(producto.margenGanancia, 50);
  assert.equal(producto.heredado.margenGanancia, true);
});

test("RF-52: cambiar el margen publica el valor anterior y el nuevo con quién lo cambió", async () => {
  const { servicio, eventos } = crearServicio();
  await servicio.crearProducto(pkm001);

  await servicio.actualizarProducto("PKM-001", { margenGanancia: 30 }, { responsable: "admin@dchobbies.test" });

  assert.deepEqual(eventos, [
    {
      evento: "parametro_modificado",
      datos: {
        correoUsuario: "admin@dchobbies.test",
        entidad: "producto",
        entidadId: "PKM-001",
        valorAnterior: { costoItem: 100, porcentajeImportacion: 20, margenGanancia: 25 },
        valorNuevo: { costoItem: 100, porcentajeImportacion: 20, margenGanancia: 30 },
      },
    },
  ]);
});

test("cambiar solo datos generales o existencias no publica cambio de parámetros", async () => {
  const { servicio, eventos } = crearServicio();
  await servicio.crearProducto(pkm001);

  await servicio.actualizarProducto("PKM-001", { nombre: "Otro nombre", existencias: 3 });
  await servicio.actualizarProducto("PKM-001", { margenGanancia: 25 });

  assert.deepEqual(eventos, []);
});

test("editar un producto que no existe responde no encontrado", async () => {
  const { servicio } = crearServicio();

  await assert.rejects(servicio.actualizarProducto("NO-EXISTE", { nombre: "X" }), RecursoNoEncontrado);
});

// Desactivar y reactivar (RF-18)

test("RF-18: descontinuar un producto lo saca de la tienda, la ficha y las familias", async () => {
  const { servicio, productos } = crearServicio();
  await servicio.crearProducto({ ...pkm001, existencias: 5 });

  await servicio.cambiarEstado("PKM-001", { estado: "descontinuado" });

  assert.equal(productos.get("PKM-001").estado, "descontinuado");
  const tienda = new CatalogoService({
    repositorio: {
      listar: async () => [...productos.values()],
      obtenerPorSku: async (sku) => productos.get(sku),
    },
    motorDePrecios,
  });
  assert.deepEqual(await tienda.listarCatalogo({ limite: 10, desplazamiento: 0 }), []);
  await assert.rejects(tienda.obtenerFicha("PKM-001"), RecursoNoEncontrado);
  assert.deepEqual(await tienda.listarFamilias(), []);
});

test("en el panel sale con disponibilidad y etiqueta descontinuado, y se puede filtrar", async () => {
  const descontinuado = { ...producto("PKM-001", "Trading Cards", 5), estado: "descontinuado" };
  const repositorio = { listarParaAdministracion: async () => [descontinuado, producto("LEG-001", "Legos", 5)] };
  const servicio = new CatalogoService({ repositorio, motorDePrecios });

  const { productos } = await servicio.listarParaAdministracion({ disponibilidad: "descontinuado", limite: 24 });

  assert.deepEqual(productos.map((p) => p.sku), ["PKM-001"]);
  assert.equal(productos[0].disponibilidad, "descontinuado");
  assert.deepEqual(productos[0].etiquetas, ["oculto_en_tienda", "descontinuado"]);
});

test("RF-18: sin filtro de disponibilidad el panel no lista los descontinuados", async () => {
  const descontinuado = { ...producto("PKM-001", "Trading Cards", 5), estado: "descontinuado" };
  const repositorio = { listarParaAdministracion: async () => [descontinuado, producto("LEG-001", "Legos", 5)] };
  const servicio = new CatalogoService({ repositorio, motorDePrecios });

  const { productos, total } = await servicio.listarParaAdministracion({ limite: 24 });

  assert.deepEqual(productos.map((p) => p.sku), ["LEG-001"]);
  assert.equal(total, 1);
});

test("reactivar devuelve el producto a la tienda y publica el cambio para la bitácora", async () => {
  const { servicio, eventos } = crearServicio();
  await servicio.crearProducto({ ...pkm001, existencias: 5 });
  await servicio.cambiarEstado("PKM-001", { estado: "descontinuado" }, { responsable: "admin@dchobbies.test" });

  const producto = await servicio.cambiarEstado("PKM-001", { estado: "activo" });

  assert.equal(producto.disponibilidad, "en_existencia");
  assert.deepEqual(
    eventos.map(({ evento, datos }) => [evento, datos.valorNuevo.estado]),
    [
      ["estado_producto_cambiado", "descontinuado"],
      ["estado_producto_cambiado", "activo"],
    ]
  );
  assert.equal(eventos[0].datos.correoUsuario, "admin@dchobbies.test");
});

test("pedir el mismo estado no publica nada y un estado desconocido da 400", async () => {
  const { servicio, eventos } = crearServicio();
  await servicio.crearProducto(pkm001);
  await servicio.cambiarEstado("PKM-001", { estado: "activo" });

  assert.deepEqual(eventos, []);
  await assert.rejects(servicio.cambiarEstado("PKM-001", { estado: "borrado" }), EntradaInvalida);
  await assert.rejects(servicio.cambiarEstado("NO-EXISTE", { estado: "activo" }), RecursoNoEncontrado);
});

// Eliminar

function crearServicioParaEliminar(resultado) {
  const eventos = [];
  const repositorio = {
    obtenerPorSku: async (sku) => (sku === "NO-EXISTE" ? null : { ...pkm001, sku }),
    eliminar: async () => resultado,
  };
  const busDeEventos = { publicar: async (evento, datos) => eventos.push({ evento, datos }) };
  return { servicio: new CatalogoService({ repositorio, motorDePrecios, busDeEventos }), eventos };
}

test("borra un producto sin historial y lo publica para la bitácora", async () => {
  const { servicio, eventos } = crearServicioParaEliminar("eliminado");

  await servicio.eliminarProducto("NUEVO-1", { responsable: "admin@dchobbies.test" });

  assert.equal(eventos[0].evento, "producto_eliminado");
  assert.equal(eventos[0].datos.entidadId, "NUEVO-1");
  assert.equal(eventos[0].datos.valorAnterior.nombre, pkm001.nombre);
});

test("un producto con ventas o movimientos no se borra y pide desactivarlo", async () => {
  const { servicio, eventos } = crearServicioParaEliminar("con_historial");

  await assert.rejects(servicio.eliminarProducto("PKM-001"), (error) => {
    assert.ok(error instanceof ProductoConHistorial);
    assert.equal(error.codigo, "PRODUCTO_CON_HISTORIAL");
    assert.equal(error.message, "Este producto tiene ventas o movimientos; desactívelo en su lugar.");
    return true;
  });
  assert.deepEqual(eventos, []);
});

test("borrar un producto que no existe responde no encontrado", async () => {
  const { servicio } = crearServicioParaEliminar("eliminado");

  await assert.rejects(servicio.eliminarProducto("NO-EXISTE"), RecursoNoEncontrado);
});

test("editar las existencias en el panel pasa por inventario con quién lo hizo", async () => {
  const fijadas = [];
  const productos = new Map([["PKM-001", { ...pkm001, existencias: 3, tasaImpuesto: 13 }]]);
  const repositorio = {
    obtenerPorSku: async (sku) => productos.get(sku) ?? null,
    actualizar: async () => {
      throw new Error("no debería escribir el stock directo");
    },
  };
  const fijarExistencias = async (sku, existencias, opciones) => {
    fijadas.push({ sku, existencias, ...opciones });
    productos.get(sku).existencias = existencias;
  };
  const servicio = new CatalogoService({ repositorio, motorDePrecios, fijarExistencias });

  const producto = await servicio.actualizarProducto("PKM-001", { existencias: 8 }, { responsable: "admin@dchobbies.test" });

  assert.deepEqual(fijadas, [{ sku: "PKM-001", existencias: 8, responsable: "admin@dchobbies.test" }]);
  assert.equal(producto.existencias, 8);
});
