/**
 * CAPA DE PERSISTENCIA — Repositorio de inventario.
 *
 * Único lugar del sistema que escribe en el esquema `inventario` (§ 9.3):
 * `existencia` guarda el saldo y `movimiento` el libro que lo explica.
 * Ambas se escriben en la misma transacción (§ 9.4).
 *
 * Expone `enTransaccion` para que el servicio pueda pedir atomicidad
 * (Unit of Work) sin conocer el driver de PostgreSQL (§ 15, convención 1).
 *
 * POR IMPLEMENTAR
 *   registrarMovimiento()   RF-13..RF-17 — tipos del CHECK de movimiento.tipo;
 *                           los ingresos llevan costo_unitario (RN-06, RF-14)
 *   actualizarExistencia()  siempre junto con registrarMovimiento()
 *   listarMovimientos()     RF-19
 *
 * El trigger de `movimiento` rechaza UPDATE y DELETE (DD-16): un error se
 * corrige con un movimiento compensatorio, nunca editando el original.
 */

import { enTransaccion } from "../../shared/db/unidad-de-trabajo.js";

export class InventarioRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /** Unit of Work: ejecuta el trabajo dentro de una sola transacción. */
  enTransaccion(trabajo) {
    return enTransaccion(this.#pool, trabajo);
  }

  /**
   * Monitor Object delegado al SGBD (§ 7.3): bloquea las filas de
   * existencia de los productos indicados hasta el COMMIT.
   *
   * Los candados se toman en UNA consulta y en orden ascendente de
   * `producto_id`: si dos pedidos los tomaran en distinto orden, cada uno
   * esperaría al otro para siempre (deadlock). Debe llamarse dentro de
   * `enTransaccion`, con el `cliente` que esta entrega.
   *
   * @returns {Promise<Map<number, number>>} producto_id → cantidad
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
}
