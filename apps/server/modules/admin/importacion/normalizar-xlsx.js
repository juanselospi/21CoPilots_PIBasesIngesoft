/**
 * Reescribe en memoria un .xlsx válido que exceljs no sabe leer.
 *
 * Algunas herramientas generan el libro con el prefijo `x:` en todas las
 * etiquetas (`<x:worksheet>`) y con tablas enlazadas por rutas absolutas.
 * Excel los abre sin problema, pero exceljs falla con los dos. Las tablas se
 * quitan porque la importación solo lee las celdas.
 */

import JSZip from "jszip";

const ESPACIO_DE_HOJAS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const PREFIJO_DECLARADO = `xmlns:x="${ESPACIO_DE_HOJAS}"`;

/** @returns el archivo normalizado; lanza si no es un .zip */
export async function normalizarXlsx(archivo) {
  const zip = await JSZip.loadAsync(archivo);

  for (const [ruta, entrada] of Object.entries(zip.files)) {
    if (entrada.dir || !ruta.startsWith("xl/")) continue;

    if (/^xl\/worksheets\/_rels\/.+\.rels$/.test(ruta)) {
      zip.file(ruta, sinRelacionesDeTabla(await entrada.async("string")));
    } else if (ruta.endsWith(".xml")) {
      const xml = sinPrefijo(await entrada.async("string"));
      zip.file(ruta, ruta.startsWith("xl/worksheets/") ? sinTablas(xml) : xml);
    }
  }

  return zip.generateAsync({ type: "nodebuffer" });
}

function sinPrefijo(xml) {
  if (!xml.includes(PREFIJO_DECLARADO)) return xml;
  return xml.replaceAll(PREFIJO_DECLARADO, `xmlns="${ESPACIO_DE_HOJAS}"`).replace(/<(\/?)x:/g, "<$1");
}

const sinRelacionesDeTabla = (xml) => xml.replace(/<Relationship\b[^>]*relationships\/table"[^>]*\/>/g, "");

const sinTablas = (xml) => xml.replace(/<tableParts\b[\s\S]*?<\/tableParts>/, "");
