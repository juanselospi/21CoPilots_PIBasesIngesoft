/**
 * Impuesto de venta sobre el precio sin impuesto.
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
