/**
 * Paso 3 — impuesto de venta sobre el precio sin impuesto.
 * RN-01, RF-05, RES-06, RNF-17.
 *
 * La tasa sale de cada producto (catalogo.producto.tasa_impuesto) como porcentaje,
 * entonces si la normativa cambia se actualiza la tabla y no esta clase.
 */

import { PasoDePrecio } from "../paso-de-precio.js";

export class ImpuestoDeVenta extends PasoDePrecio {
  get nombre() {
    return "impuesto";
  }

  aplicar(monto, producto) {
    const tasa = Number(producto.tasaImpuesto ?? 0);
    return monto * (1 + tasa / 100);
  }
}
