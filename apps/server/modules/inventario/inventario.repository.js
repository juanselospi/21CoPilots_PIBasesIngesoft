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

  /**
   * Bloquea las filas de los productos hasta que termine la transacción, en
   * orden de SKU para que dos transacciones no se esperen una a la otra.
   * @returns un Map por SKU con el stock y el estado actuales
   */
  async bloquearProductos(cliente, skus) {
    const { rows } = await cliente.query(
      `SELECT sku, nombre, stock, estado, contrapedido
         FROM catalogo.producto
        WHERE sku = ANY($1::text[])
        ORDER BY sku
          FOR UPDATE`,
      [[...new Set(skus)].sort()]
    );
    return new Map(rows.map((fila) => [fila.sku, fila]));
  }

  /**
   * Mueve el stock y deja el movimiento en el historial (RF-15). La cantidad
   * es positiva si entra mercancía y negativa si sale.
   * @returns el movimiento con la fecha y las existencias que quedaron
   */
  async registrarMovimiento(
    cliente,
    { sku, cantidad, tipo, correoAdministrador = null, costoUnitario = null, motivo = null }
  ) {
    const { rows: [producto] } = await cliente.query(
      `UPDATE catalogo.producto SET stock = stock + $2 WHERE sku = $1 RETURNING stock`,
      [sku, cantidad]
    );
    const { rows: [movimiento] } = await cliente.query(
      `INSERT INTO inventario.producto_administra
              (sku, correo_administrador, cantidad, tipo, costo_unitario, motivo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING fecha`,
      [sku, correoAdministrador, cantidad, tipo, costoUnitario, motivo]
    );
    return { sku, cantidad, tipo, costoUnitario, motivo, fecha: movimiento.fecha, existenciasResultantes: producto.stock };
  }

  /** RF-14: el costo de la última compra pasa a ser el costo del producto; el anterior queda en el historial. */
  async actualizarCosto(cliente, sku, costoUnitario) {
    await cliente.query(`UPDATE catalogo.producto SET item = $2 WHERE sku = $1`, [sku, costoUnitario]);
  }

  /** RF-19: el historial de movimientos, de lo más nuevo a lo más viejo. */
  async listarMovimientos({ sku, tipo, desde, hasta, limite, pagina }) {
    const { rows } = await this.#pool.query(
      `SELECT sku, nombre, fecha, cantidad, correo_administrador, tipo, costo_unitario, motivo,
              count(*) OVER () AS total
         FROM reportes.v_registro_mercancia
        WHERE ($1::text IS NULL OR sku = $1)
          AND ($2::text IS NULL OR tipo = $2)
          AND ($3::timestamptz IS NULL OR fecha >= $3)
          AND ($4::timestamptz IS NULL OR fecha < $4)
        ORDER BY fecha DESC
        LIMIT $5 OFFSET $6`,
      [sku, tipo, desde, hasta, limite, pagina * limite]
    );

    return {
      movimientos: rows.map((fila) => ({
        sku: fila.sku,
        nombre: fila.nombre,
        fecha: fila.fecha,
        cantidad: fila.cantidad,
        tipo: fila.tipo,
        costoUnitario: fila.costo_unitario === null ? null : Number(fila.costo_unitario),
        motivo: fila.motivo,
        responsable: fila.correo_administrador,
      })),
      total: Number(rows[0]?.total ?? 0),
    };
  }
}
