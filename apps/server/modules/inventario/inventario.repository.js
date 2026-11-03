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

  /**
   * Productos activos con el stock en el umbral o por debajo, los más
   * urgentes primero. Uno descontinuado no se va a reponer, así que no avisa.
   */
  async listarExistenciasBajas(umbral) {
    const { rows } = await this.#pool.query(
      `SELECT e.sku, e.nombre, e.categoria, e.stock, e.contrapedido
         FROM reportes.v_existencias e
         JOIN catalogo.producto p ON p.sku = e.sku
        WHERE p.estado = 'activo'
          AND e.stock <= $1
        ORDER BY e.stock, e.nombre`,
      [umbral]
    );

    return rows.map((fila) => ({
      sku: fila.sku,
      nombre: fila.nombre,
      familia: fila.categoria,
      existencias: fila.stock,
      admiteContrapedido: fila.contrapedido,
    }));
  }
}
