/**
 * Repositorio de inventario.
 *
 * Falta implementar:
 *   - registrarMovimiento(): los ingresos llevan costo_unitario (RN-06)
 *   - actualizarExistencia(): siempre junto con registrarMovimiento()
 *   - listarMovimientos()
 */

import { enTransaccion } from "../../shared/db/unidad-de-trabajo.js";

/** Todo el trabajo debe ejecutarse dentro de una sola transacción. */
export class InventarioRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  // Se hace todo en esta sola transaccion
  enTransaccion(trabajo) {
    return enTransaccion(this.#pool, trabajo);
  }
}
