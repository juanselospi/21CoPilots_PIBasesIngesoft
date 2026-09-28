import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";

import { ImportacionDeExcel } from "./importacion-de-excel.js";
import { COLUMNAS, TIPOS } from "./columnas.js";
import { EntradaInvalida } from "../../../shared/errores/errores-de-dominio.js";

const ENCABEZADOS = COLUMNAS.map((c) => c.encabezado);
const URL_IMAGEN = "https://placehold.co/500x500/003791/FFFFFF?text=God%20of%20War%20Ragnar%C3%B6k";

// Filas copiadas de la hoja real. Los porcentajes van como los guarda
// Excel (0.2 con formato "0.0%") y las columnas calculadas como fórmulas.
const GOD_OF_WAR = {
  codigo_item: "PS5-001",
  familia: "Video Juegos",
  codigo_sku: "PS5-WAJH-ZX6C",
  descripcion: 'Videojuego "God of War Ragnarök" para PlayStation 5, género Acción/Aventura.',
  descripcion_corta: "God of War Ragnarök (PS5)",
  costo_usd: 49.99,
  "%_costo_importacion": 0.2,
  costo_importacion: { formula: "F2*G2", result: 9.998 },
  total_costo_item: { formula: "F2+H2", result: 59.988 },
  "%_margen_ganancia": 0.2,
  precio_venta_sin_IVA: { formula: "I2*(1+J2)", result: 71.9856 },
  "%_IVA": 0.13,
  precio_venta_con_IVA: { formula: "K2*(1+L2)", result: 81.343728 },
  url_imagen: { text: URL_IMAGEN, hyperlink: URL_IMAGEN },
};

const MILLENNIUM_FALCON = {
  codigo_item: "LEG-001",
  familia: "Legos",
  codigo_sku: "LEG-QGR6-3FCS",
  descripcion_corta: "LEGO Star Wars Millennium Falcon (1351 piezas)",
  costo_usd: 169.99,
  "%_costo_importacion": 0.15,
  "%_margen_ganancia": 0.18,
  "%_IVA": 0.13,
};

const conCambios = (base, cambios) => ({ ...base, ...cambios });

// Arma el .xlsx en memoria. Un null en `filas` deja esa fila en blanco.
async function crearExcel(filas, { encabezados = ENCABEZADOS, filasPrevias = [] } = {}) {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Productos");

  for (const previa of filasPrevias) hoja.addRow(previa);
  hoja.addRow(encabezados);

  for (const fila of filas) {
    if (fila === null) {
      hoja.addRow([]);
      continue;
    }
    const nueva = hoja.addRow(encabezados.map((e) => fila[e] ?? null));
    encabezados.forEach((encabezado, indice) => {
      const definicion = COLUMNAS.find((c) => c.encabezado === encabezado);
      if (definicion?.tipo === TIPOS.PORCENTAJE) nueva.getCell(indice + 1).numFmt = "0.0%";
    });
  }

  return libro.xlsx.writeBuffer();
}

function crearImportacion() {
  const guardados = [];
  const importacion = new ImportacionDeExcel({
    guardarProducto: async (producto) => guardados.push(producto),
    impuestoDeVenta: 0.13,
  });
  return { importacion, guardados };
}

async function importar(filas, opciones) {
  const { importacion, guardados } = crearImportacion();
  const resultado = await importacion.importar(await crearExcel(filas, opciones));
  return { resultado, guardados };
}

async function motivosDe(fila) {
  const { resultado } = await importar([fila]);
  return resultado.rechazadas[0]?.motivos ?? [];
}

// Parser (SCRUM-33)

test("lee una fila real: porcentajes, fórmulas e hipervínculo", async () => {
  const { importacion } = crearImportacion();
  const [fila] = await importacion.parsear(await crearExcel([GOD_OF_WAR]));

  assert.deepEqual(fila, {
    linea: 2,
    codigoItem: "PS5-001",
    familia: "Video Juegos",
    codigoSku: "PS5-WAJH-ZX6C",
    descripcion: GOD_OF_WAR.descripcion,
    nombre: "God of War Ragnarök (PS5)",
    costo: 49.99,
    porcentajeImportacion: 20,
    margenGanancia: 20,
    porcentajeIva: 13,
    precioConIva: 81.343728,
    imagenUrl: URL_IMAGEN,
  });
});

test("acepta montos y porcentajes escritos como texto", async () => {
  const { importacion } = crearImportacion();
  const [fila] = await importacion.parsear(
    await crearExcel([
      conCambios(GOD_OF_WAR, {
        costo_usd: "$1,073.37",
        "%_costo_importacion": "15%",
        "%_margen_ganancia": " 18.5 % ",
      }),
    ])
  );

  assert.equal(fila.costo, 1073.37);
  assert.equal(fila.porcentajeImportacion, 15);
  assert.equal(fila.margenGanancia, 18.5);
});

test("encuentra el encabezado bajo un título y sin importar mayúsculas ni tildes", async () => {
  const encabezados = ENCABEZADOS.map((e) => (e === "descripcion_corta" ? "  Descripción_Corta " : e));
  const renombrada = { ...GOD_OF_WAR, "  Descripción_Corta ": GOD_OF_WAR.descripcion_corta };

  const { importacion } = crearImportacion();
  const [fila] = await importacion.parsear(
    await crearExcel([renombrada], { encabezados, filasPrevias: [["Catálogo DC Hobbies"], []] })
  );

  assert.equal(fila.linea, 4);
  assert.equal(fila.nombre, "God of War Ragnarök (PS5)");
});

test("salta filas vacías y conserva el número de fila del archivo", async () => {
  const soloEspacios = Object.fromEntries(ENCABEZADOS.map((e) => [e, "   "]));
  const { importacion } = crearImportacion();

  const filas = await importacion.parsear(
    await crearExcel([GOD_OF_WAR, null, soloEspacios, MILLENNIUM_FALCON])
  );

  assert.deepEqual(filas.map((f) => f.linea), [2, 5]);
});

test("las columnas opcionales pueden faltar en el archivo", async () => {
  const opcionales = ["descripcion", "%_IVA", "url_imagen"];
  const encabezados = ENCABEZADOS.filter((e) => !opcionales.includes(e));

  const { resultado, guardados } = await importar([GOD_OF_WAR], { encabezados });

  assert.equal(resultado.importadas, 1);
  assert.equal(guardados[0].descripcion, null);
  assert.equal(guardados[0].imagenUrl, null);
});

test("rechaza el archivo completo si falta una columna obligatoria", async () => {
  const encabezados = ENCABEZADOS.filter((e) => e !== "costo_usd");
  const { importacion } = crearImportacion();

  await assert.rejects(importacion.importar(await crearExcel([GOD_OF_WAR], { encabezados })), (error) => {
    assert.ok(error instanceof EntradaInvalida);
    assert.match(error.message, /costo_usd/);
    return true;
  });
});

test("rechaza un archivo que no es .xlsx", async () => {
  const { importacion } = crearImportacion();
  await assert.rejects(importacion.importar(Buffer.from("codigo_sku,familia\n")), EntradaInvalida);
});

test("rechaza un Excel sin fila de encabezados de productos", async () => {
  const libro = new ExcelJS.Workbook();
  libro.addWorksheet("Hoja1").addRow(["cualquier", "cosa"]);
  const { importacion } = crearImportacion();

  await assert.rejects(importacion.importar(await libro.xlsx.writeBuffer()), EntradaInvalida);
});

// Validación (SCRUM-34)

test("una fila real completa es válida", async () => {
  assert.deepEqual(await motivosDe(GOD_OF_WAR), []);
});

const CASOS_INVALIDOS = [
  ["codigo_sku vacío", { codigo_sku: "  " }, /Falta el codigo_sku/],
  ["codigo_sku demasiado largo", { codigo_sku: "X".repeat(51) }, /supera los 50/],
  ["familia vacía", { familia: null }, /Falta familia/],
  ["descripcion_corta vacía", { descripcion_corta: null }, /Falta descripcion_corta/],
  ["codigo_item vacío", { codigo_item: null }, /Falta el codigo_item/],
  ["prefijo de codigo_item desconocido", { codigo_item: "XBX-001" }, /prefijo conocido/],
  ["costo no numérico", { costo_usd: "abc" }, /costo_usd no es un número/],
  ["costo vacío", { costo_usd: null }, /Falta costo_usd/],
  ["costo negativo", { costo_usd: -1 }, /costo_usd no puede ser menor que 0/],
  ["importación negativa", { "%_costo_importacion": -0.05 }, /%_costo_importacion no puede ser menor/],
  ["margen de -100 %", { "%_margen_ganancia": -1 }, /debe ser mayor que -100/],
  ["IVA distinto al del sistema", { "%_IVA": 0.15 }, /15 %.*13 %/],
  ["url_imagen no es una dirección web", { url_imagen: "imagen.png" }, /url_imagen no es una dirección/],
  ["fórmula con error", { costo_usd: { formula: "1/0", result: { error: "#DIV/0!" } } }, /no es un número/],
];

for (const [caso, cambios, esperado] of CASOS_INVALIDOS) {
  test(`rechaza la fila: ${caso}`, async () => {
    const motivos = await motivosDe(conCambios(GOD_OF_WAR, cambios));
    assert.ok(
      motivos.some((m) => esperado.test(m)),
      `se esperaba un motivo ${esperado}, llegaron: ${JSON.stringify(motivos)}`
    );
  });
}

test("RN-02: acepta margen negativo mayor que -100 %", async () => {
  assert.deepEqual(await motivosDe(conCambios(GOD_OF_WAR, { "%_margen_ganancia": -0.1 })), []);
});

test("informa todos los problemas de una fila, no solo el primero", async () => {
  const motivos = await motivosDe(conCambios(GOD_OF_WAR, { familia: null, costo_usd: "abc" }));
  assert.equal(motivos.length, 2);
});

test("un código repetido en el archivo rechaza todas sus apariciones", async () => {
  const { resultado, guardados } = await importar([
    GOD_OF_WAR,
    MILLENNIUM_FALCON,
    conCambios(GOD_OF_WAR, { codigo_sku: " ps5-wajh-zx6c " }),
  ]);

  assert.equal(resultado.importadas, 1);
  assert.deepEqual(resultado.rechazadas.map((r) => r.linea), [2, 4]);
  assert.match(resultado.rechazadas[0].motivos[0], /PS5-WAJH-ZX6C se repite en las filas 2, 4/);
  assert.equal(guardados[0].sku, "LEG-QGR6-3FCS");
});

// Importación completa

test("RF-58: importa las válidas, rechaza las inválidas e informa el total", async () => {
  const { resultado, guardados } = await importar([
    GOD_OF_WAR,
    conCambios(MILLENNIUM_FALCON, { costo_usd: "no sé" }),
    conCambios(MILLENNIUM_FALCON, { codigo_sku: "leg-wl42-xhga", codigo_item: "LEG-002" }),
  ]);

  assert.equal(resultado.leidas, 3);
  assert.equal(resultado.importadas, 2);
  assert.equal(resultado.rechazadas.length, 1);
  assert.equal(resultado.rechazadas[0].linea, 3);

  assert.deepEqual(guardados[0], {
    sku: "PS5-WAJH-ZX6C",
    nombre: "God of War Ragnarök (PS5)",
    descripcion: GOD_OF_WAR.descripcion,
    categoria: "Video Juegos",
    subcategoria: "PlayStation 5",
    imagenUrl: URL_IMAGEN,
    costoItem: 49.99,
    porcentajeImportacion: 20,
    margenGanancia: 20,
  });
  assert.equal(guardados[1].sku, "LEG-WL42-XHGA");
  assert.equal(guardados[1].subcategoria, "LEGO");
});

test("SCRUM-30: la plantilla versionada se importa sin rechazos", async () => {
  const plantilla = await readFile(new URL("./plantilla-de-productos.xlsx", import.meta.url));
  const { importacion, guardados } = crearImportacion();

  const resultado = await importacion.importar(plantilla);

  assert.deepEqual(resultado.rechazadas, []);
  assert.equal(resultado.importadas, 1);
  assert.equal(guardados[0].sku, "PS5-WAJH-ZX6C");
});
