/**
 * Paso 2 — margen de ganancia configurable.
 * RN-01, RF-04.
 *
 * El margen puede ser negativo: RN-02 permite vender por debajo del costo
 * un producto defectuoso o de liquidación (RF-43). Por eso aquí no hay
 * ninguna validación de signo (§ 6.5); la tabla solo impide que llegue a
 * -100 % o menos, para que el precio no quede en cero.
 */

import { PasoDePrecio } from "../paso-de-precio.js";

export class MargenDeGanancia extends PasoDePrecio {
  get nombre() {
    return "margen";
  }

  aplicar(monto, producto) {
    const margen = Number(producto.margenGanancia ?? 0);
    return monto * (1 + margen / 100);
  }
}
