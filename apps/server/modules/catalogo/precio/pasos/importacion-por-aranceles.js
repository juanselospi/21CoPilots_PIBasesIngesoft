/**
 * Paso 1 — costo más el porcentaje de importación por aranceles.
 * RN-01, RF-03.
 */

import { PasoDePrecio } from "../paso-de-precio.js";

export class ImportacionPorAranceles extends PasoDePrecio {
  get nombre() {
    return "importacion";
  }

  aplicar(monto, producto) {
    const porcentaje = Number(producto.porcentajeImportacion ?? 0);
    return monto * (1 + porcentaje / 100);
  }
}
