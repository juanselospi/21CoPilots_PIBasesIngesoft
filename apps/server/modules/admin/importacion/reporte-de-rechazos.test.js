import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";

import { generarReporteDeRechazos } from "./reporte-de-rechazos.js";
import { ImportacionDeExcel } from "./importacion-de-excel.js";
import { COLUMNAS } from "./columnas.js";

async function crearExcel(filas) {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Productos");
  const encabezados = COLUMNAS.map((c) => c.encabezado);
  hoja.addRow(encabezados);
  for (const fila of filas) {
    const nueva = hoja.addRow(encabezados.map((e) => fila[e] ?? null));
    encabezados.forEach((e, i) => {
      if (e.startsWith("%")) nueva.getCell(i + 1).numFmt = "0.0%";
    });
  }
  return libro.xlsx.writeBuffer();
}

/** Filas del reporte como arreglos, sin el encabezado. */
async function leerReporte(buffer) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(buffer);
  const filas = [];
  libro.worksheets[0].eachRow((fila, numero) => {
    if (numero > 1) filas.push(fila.values.slice(1));
  });
  return filas;
}

const valida = {
  codigo_item: "PS5-001",
  familia: "Video Juegos",
  codigo_sku: "PS5-WAJH-ZX6C",
  descripcion_corta: "God of War Ragnarök (PS5)",
  costo_usd: 49.99,
  "%_costo_importacion": 0.2,
  "%_margen_ganancia": 0.2,
};

test("una hoja con un código vacío genera un reporte con esa fila y su motivo", async () => {
  const importacion = new ImportacionDeExcel({
    enTransaccion: (trabajo) => trabajo({}),
    guardarProducto: async () => ({ insertado: true }),
    impuestoDeVenta: 0.13,
  });
  const archivo = await crearExcel([valida, { ...valida, codigo_sku: "", descripcion_corta: "Sin código" }]);

  const { rechazadas } = await importacion.importar(archivo);
  const reporte = await leerReporte(await generarReporteDeRechazos(rechazadas));

  assert.deepEqual(reporte, [[3, "", "Sin código", "Falta el codigo_sku."]]);
});

test("pone cada motivo en su propia línea dentro de la celda", async () => {
  const reporte = await leerReporte(
    await generarReporteDeRechazos([
      { linea: 7, fila: { codigoSku: "LEG-001", nombre: "LEGO" }, motivos: ["Falta familia.", "costo_usd no es un número."] },
    ])
  );

  assert.deepEqual(reporte, [[7, "LEG-001", "LEGO", "Falta familia.\ncosto_usd no es un número."]]);
});
