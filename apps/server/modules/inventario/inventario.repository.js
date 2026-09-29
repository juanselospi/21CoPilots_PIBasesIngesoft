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

export class InventarioRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /** Ejecuta el trabajo dentro de una sola transacción. */
  enTransaccion(trabajo) {
    return enTransaccion(this.#pool, trabajo);
  }

  /**
   * Bloquea las existencias de los productos hasta el COMMIT, para que dos
   * pedidos al mismo tiempo no vendan la misma unidad.
   *
   * Se bloquean en una sola consulta y ordenadas por producto_id. Si dos
   * pedidos las bloquearan en distinto orden, cada uno se quedaría
   * esperando al otro (deadlock). Hay que llamarla dentro de
   * `enTransaccion`, con el `cliente` que esta entrega.
   *
   * @returns {Promise<Map<number, number>>} de producto_id a cantidad
   */
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

  /**
   * Crea la fila de existencias en 0 de un producto nuevo. No registra
   * movimiento porque no entra mercancía. Sin esta fila,
   * bloquearExistencias no podría bloquear el producto al confirmar un
   * pedido.
   */
  async crearExistenciaSiFalta(cliente, productoId) {
    await cliente.query(
      `INSERT INTO inventario.existencia (producto_id) VALUES ($1)
       ON CONFLICT (producto_id) DO NOTHING`,
      [productoId]
    );
  }
}
