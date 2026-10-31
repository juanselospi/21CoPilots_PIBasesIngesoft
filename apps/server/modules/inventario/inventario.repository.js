/**
 * Repositorio de inventario.
 *
 * Cada movimiento bloquea primero la fila del producto con
 * `SELECT ... FOR UPDATE`, en orden de SKU cuando son varios, para que dos
 * compras no se lleven la misma unidad y no haya bloqueos cruzados.
 *
 * La llave de `producto_administra` incluye la fecha. `now()` devuelve la
 * misma hora en toda la transacción, así que dos movimientos del mismo SKU
 * en una transacción chocarían: la fecha se llena con `clock_timestamp()`.
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
