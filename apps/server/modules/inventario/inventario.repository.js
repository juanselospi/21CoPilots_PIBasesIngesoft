/**
 * Repositorio de inventario.
 *
 * Es el único lugar del sistema que escribe en el esquema `inventario`.
 * `existencia` guarda cuánto hay de cada producto y `movimiento` explica
 * cómo se llegó a ese número; las dos se escriben en la misma transacción.
 *
 * Falta implementar:
 *   - registrarMovimiento(): los ingresos llevan costo_unitario (RN-06)
 *   - actualizarExistencia(): siempre junto con registrarMovimiento()
 *   - listarMovimientos()
 *
 * Los movimientos no se pueden editar ni borrar (lo impide un trigger).
 * Un error se corrige con otro movimiento que lo compense.
 */

import { enTransaccion } from "../../shared/db/unidad-de-trabajo.js";

/** Todo el trabajo debe ejecutarse dentro de una sola transacción. */

/**
 * Bloquea las existencias de los productos hasta el COMMIT, para que dos
 * pedidos al mismo tiempo no vendan la misma unidad.
 */
export class InventarioRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  // Se hace todo en esta sola transaccion
  enTransaccion(trabajo) {
    return enTransaccion(this.#pool, trabajo);
  }

  // Bloquea las existnecias en orden de a que cliente se le ofrecen primero
  async bloquearExistencias(cliente, productoIds) {
    const { rows } = await cliente.query(
      `SELECT producto_id, cantidad
         FROM inventario.existencia
        WHERE producto_id = ANY($1::bigint[])
        ORDER BY producto_id
          FOR UPDATE`,
      [productoIds]
    );

    return new Map(rows.map((fila) => [Number(fila.producto_id), fila.cantidad]));
  }
}
