/**
 * CAPA DE PERSISTENCIA — Repositorio de carrito y pedidos.
 *
 * El pedido se identifica por `(correo_cliente, num_carrito)`. Las líneas
 * viven en `agrega` con el precio sin impuesto y la tasa del momento, y el
 * estado vigente se lee de `reportes.v_estado_pedido`, no de una columna.
 *
 * POR IMPLEMENTAR
 *   crearPedido()                       RF-25 — carrito a `convertido` con `fecha_cierre`
 *   cambiarEstado()                     RF-26, RF-27 — inserta en historial_estado
 *   listarPorCliente()                  RF-29, RF-37
 */

import { enTransaccion } from "../../shared/db/unidad-de-trabajo.js";

export class PedidosRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /** Unit of Work: ejecuta el trabajo dentro de una sola transacción. */
  enTransaccion(trabajo) {
    return enTransaccion(this.#pool, trabajo);
  }

  /** Monto de cada modalidad de entrega. */
  async listarTarifas() {
    const { rows } = await this.#pool.query(`SELECT modalidad, monto FROM pedidos.tarifa_envio`);
    return rows.map((fila) => ({ modalidad: fila.modalidad, monto: Number(fila.monto) }));
  }

  /** El carrito activo del cliente con sus líneas, o null si no tiene. */
  async obtenerCarritoActivo(correo) {
    const { rows } = await this.#pool.query(
      `SELECT c.num_carrito, a.sku, a.cantidad_solicitada, a.precio_unitario, a.tasa_impuesto_aplicada
         FROM pedidos.carrito c
         LEFT JOIN pedidos.agrega a
                ON a.correo_cliente = c.correo_cliente AND a.num_carrito = c.num_carrito
        WHERE c.correo_cliente = $1
          AND c.estado_carrito = 'activo'
        ORDER BY a.sku`,
      [correo]
    );
    if (rows.length === 0) return null;

    return {
      numCarrito: rows[0].num_carrito,
      lineas: rows
        .filter((fila) => fila.sku !== null)
        .map((fila) => ({
          sku: fila.sku,
          cantidad: fila.cantidad_solicitada,
          precioUnitario: Number(fila.precio_unitario),
          tasaImpuesto: Number(fila.tasa_impuesto_aplicada),
        })),
    };
  }

  /**
   * Crea el carrito activo con el número siguiente. Si dos peticiones lo
   * intentan a la vez, el índice de un solo carrito activo deja pasar una y
   * las dos se quedan con ese.
   * @returns el número del carrito activo
   */
  async abrirCarrito(correo) {
    await this.#pool.query(
      `INSERT INTO pedidos.carrito (correo_cliente, num_carrito)
       SELECT $1::varchar, coalesce(max(num_carrito), 0) + 1 FROM pedidos.carrito WHERE correo_cliente = $1::varchar
       ON CONFLICT DO NOTHING`,
      [correo]
    );
    const { rows } = await this.#pool.query(
      `SELECT num_carrito FROM pedidos.carrito WHERE correo_cliente = $1 AND estado_carrito = 'activo'`,
      [correo]
    );
    return rows[0].num_carrito;
  }

  /** Crea la línea o le cambia la cantidad y el precio. */
  async guardarLinea(correo, numCarrito, { sku, cantidad, precioUnitario, tasaImpuesto }) {
    await this.#pool.query(
      `INSERT INTO pedidos.agrega
              (correo_cliente, num_carrito, sku, cantidad_solicitada, precio_unitario, tasa_impuesto_aplicada)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (correo_cliente, num_carrito, sku) DO UPDATE SET
              cantidad_solicitada    = EXCLUDED.cantidad_solicitada,
              precio_unitario        = EXCLUDED.precio_unitario,
              tasa_impuesto_aplicada = EXCLUDED.tasa_impuesto_aplicada`,
      [correo, numCarrito, sku, cantidad, precioUnitario, tasaImpuesto]
    );
  }

  async quitarLinea(correo, numCarrito, sku) {
    await this.#pool.query(
      `DELETE FROM pedidos.agrega WHERE correo_cliente = $1 AND num_carrito = $2 AND sku = $3`,
      [correo, numCarrito, sku]
    );
  }
}
