/**
 * Repositorio de pagos: cada intento de cobro de un pedido (RF-39, RF-40).
 *
 * Nunca recibe ni guarda datos de la tarjeta (RNF-09): solo la referencia
 * que devuelve la pasarela, el monto, el medio y el resultado.
 */

export class PagosRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /** Dentro de la transacción del pedido, porque el pago apunta a él. */
  async registrar(cliente, { numReferencia, monto, metodoPago, estadoPago, correoCliente, numCarrito }) {
    const { rows } = await cliente.query(
      `INSERT INTO pagos.pago (num_referencia, monto, metodo_pago, estado_pago, correo_cliente, num_carrito)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING fecha`,
      [numReferencia, monto, metodoPago, estadoPago, correoCliente, numCarrito]
    );
    return { numReferencia, monto, metodoPago, estadoPago, fecha: rows[0].fecha };
  }

  /** Los pagos de un pedido, el más reciente primero. */
  async listarPorPedido(correoCliente, numCarrito) {
    const { rows } = await this.#pool.query(
      `SELECT num_referencia, fecha, monto, metodo_pago, estado_pago
         FROM pagos.pago
        WHERE correo_cliente = $1 AND num_carrito = $2
        ORDER BY fecha DESC`,
      [correoCliente, numCarrito]
    );
    return rows.map((fila) => ({
      numReferencia: fila.num_referencia,
      fecha: fila.fecha,
      monto: Number(fila.monto),
      metodoPago: fila.metodo_pago,
      estadoPago: fila.estado_pago,
    }));
  }

  /** Lo que se cobró del pedido: la suma de sus pagos aprobados. */
  async montoAprobado(correoCliente, numCarrito, cliente = this.#pool) {
    const { rows } = await cliente.query(
      `SELECT coalesce(sum(monto), 0) AS monto
         FROM pagos.pago
        WHERE correo_cliente = $1 AND num_carrito = $2 AND estado_pago = 'aprobado'`,
      [correoCliente, numCarrito]
    );
    return Number(rows[0].monto);
  }
}
