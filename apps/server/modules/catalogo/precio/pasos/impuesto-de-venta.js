/**
 * Paso 3 — impuesto de venta sobre el precio sin impuesto.
 * RN-01, RF-05, RES-06, RNF-17.
 *
 * La tasa entra por constructor en lugar de estar escrita en el código:
 * si la normativa cambia, se cambia la configuración, no la clase.
 */

import { PasoDePrecio } from "../paso-de-precio.js";

export class ImpuestoDeVenta extends PasoDePrecio {
  #tasa;

  /** @param {number} tasa proporción, no porcentaje: 0.13 */
  constructor(tasa) {
    super();
    this.#tasa = tasa;
  }

  get nombre() {
    return "impuesto";
  }

  aplicar(monto) {
    return monto * (1 + this.#tasa);
  }
}
