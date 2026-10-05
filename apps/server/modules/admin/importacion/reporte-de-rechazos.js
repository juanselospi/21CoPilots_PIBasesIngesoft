/**
 * Reporte de las filas rechazadas en una importación
 */

import ExcelJS from "exceljs";

export const TIPO_DEL_REPORTE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const NOMBRE_DEL_REPORTE = "filas-rechazadas.xlsx";

/**
 * @param {Array<{linea: number, fila: object, motivos: string[]}>} rechazadas
 * @returns {Promise<Buffer>}
 */
export async function generarReporteDeRechazos(rechazadas) {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Filas rechazadas", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  hoja.columns = [
    { header: "Fila", key: "fila", width: 8 },
    { header: "codigo_sku", key: "codigoSku", width: 20 },
    { header: "descripcion_corta", key: "nombre", width: 40 },
    { header: "Motivos", key: "motivos", width: 80 },
  ];

  const encabezado = hoja.getRow(1);
  encabezado.font = { bold: true, color: { argb: "FFFFFFFF" } };
  encabezado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };

  for (const { linea, fila, motivos } of rechazadas) {
    const nueva = hoja.addRow({
      fila: linea,
      codigoSku: fila.codigoSku ?? "",
      nombre: fila.nombre ?? "",
      // Un motivo por línea dentro de la misma celda.
      motivos: motivos.join("\n"),
    });
    nueva.getCell("motivos").alignment = { wrapText: true, vertical: "top" };
  }

  return Buffer.from(await libro.xlsx.writeBuffer());
}
