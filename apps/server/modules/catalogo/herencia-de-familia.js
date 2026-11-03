/**
 * Importación y margen que valen para un producto.
 *
 * El producto guarda NULL cuando usa el valor de su familia y un número
 * cuando lo sobrescribe. El precio y las etiquetas se calculan siempre con
 * el valor que vale, y `heredado` dice de dónde salió cada uno.
 */

export function conValoresDeLaFamilia(producto) {
  const importacionPropia = producto.porcentajeImportacion ?? null;
  const margenPropio = producto.margenGanancia ?? null;

  return {
    ...producto,
    porcentajeImportacion: importacionPropia ?? producto.familia?.porcentajeImportacion ?? 0,
    margenGanancia: margenPropio ?? producto.familia?.margenGanancia ?? 0,
    heredado: {
      porcentajeImportacion: importacionPropia === null,
      margenGanancia: margenPropio === null,
    },
  };
}
