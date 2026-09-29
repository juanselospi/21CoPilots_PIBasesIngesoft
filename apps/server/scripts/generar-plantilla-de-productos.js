/**
 * Genera modules/admin/importacion/plantilla-de-productos.xlsx
 *
 * Usa las mismas columnas que el parser (columnas.js), así que si se
 * cambia una columna hay que correr esto de nuevo:  npm run plantilla
 *
 * La fila de ejemplo es una fila real de la hoja del negocio, con las
 * mismas fórmulas.
 */

import path from "node:path";
import ExcelJS from "exceljs";
import { COLUMNAS, TIPOS, RUTA_DE_LA_PLANTILLA } from "../modules/admin/importacion/columnas.js";

const destino = RUTA_DE_LA_PLANTILLA;

const FORMATO = {
  [TIPOS.MONTO]: '"$"#,##0.00',
  [TIPOS.PORCENTAJE]: "0.0%",
};

const EJEMPLO = {
  codigo_item: "PS5-001",
  familia: "Video Juegos",
  codigo_sku: "PS5-WAJH-ZX6C",
  descripcion:
    'Videojuego "God of War Ragnarök" para PlayStation 5, género Acción/Aventura. ' +
    "Edición estándar en formato físico, disco Blu-ray, en español/inglés (voces y " +
    "subtítulos según región). Incluye caja original y manual digital.",
  descripcion_corta: "God of War Ragnarök (PS5)",
  costo_usd: 49.99,
  "%_costo_importacion": 0.2,
  "%_margen_ganancia": 0.2,
  "%_IVA": 0.13,
  url_imagen: "https://placehold.co/500x500/003791/FFFFFF?text=God%20of%20War%20Ragnar%C3%B6k",
};

const libro = new ExcelJS.Workbook();
const hoja = libro.addWorksheet("Productos", { views: [{ state: "frozen", ySplit: 1 }] });

hoja.columns = COLUMNAS.map(({ encabezado, tipo }) => ({
  header: encabezado,
  key: encabezado,
  width: encabezado.startsWith("descripcion") ? 45 : encabezado === "url_imagen" ? 60 : 20,
  style: FORMATO[tipo] ? { numFmt: FORMATO[tipo] } : {},
}));

const encabezado = hoja.getRow(1);
encabezado.font = { bold: true, color: { argb: "FFFFFFFF" } };
encabezado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };

// Se guarda también el resultado de cada fórmula; si no, quien lea el
// archivo sin abrirlo en Excel vería las celdas vacías.
const celda = (nombre) => `${hoja.getColumn(nombre).letter}2`;
const costoImportacion = EJEMPLO.costo_usd * EJEMPLO["%_costo_importacion"];
const totalCosto = EJEMPLO.costo_usd + costoImportacion;
const sinIva = totalCosto * (1 + EJEMPLO["%_margen_ganancia"]);
const conIva = sinIva * (1 + EJEMPLO["%_IVA"]);

hoja.addRow({
  ...EJEMPLO,
  costo_importacion: {
    formula: `${celda("costo_usd")}*${celda("%_costo_importacion")}`,
    result: costoImportacion,
  },
  total_costo_item: {
    formula: `${celda("costo_usd")}+${celda("costo_importacion")}`,
    result: totalCosto,
  },
  precio_venta_sin_IVA: {
    formula: `${celda("total_costo_item")}*(1+${celda("%_margen_ganancia")})`,
    result: sinIva,
  },
  precio_venta_con_IVA: {
    formula: `${celda("precio_venta_sin_IVA")}*(1+${celda("%_IVA")})`,
    result: conIva,
  },
  url_imagen: { text: EJEMPLO.url_imagen, hyperlink: EJEMPLO.url_imagen },
});

// Segunda hoja con la explicación de cada columna.
const ayuda = libro.addWorksheet("Instrucciones");
ayuda.columns = [
  { header: "Columna", key: "columna", width: 24 },
  { header: "Obligatoria", key: "obligatoria", width: 14 },
  { header: "Tipo", key: "tipo", width: 14 },
  { header: "Descripción", key: "ayuda", width: 80 },
];
ayuda.getRow(1).font = { bold: true };
for (const { encabezado: columna, obligatoria, calculada, tipo, ayuda: texto } of COLUMNAS) {
  ayuda.addRow({
    columna,
    obligatoria: calculada ? "Calculada" : obligatoria ? "Sí" : "No",
    tipo,
    ayuda: texto,
  });
}

await libro.xlsx.writeFile(destino);
console.log(`Plantilla generada en ${path.relative(process.cwd(), destino)}`);
