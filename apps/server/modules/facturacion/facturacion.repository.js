/**
 * Repositorio de facturación: el emisor y las facturas emitidas (RF-41).
 *
 * La factura se liga al pago (`num_referencia`) y solo se guarda si se
 * emitió; sus montos salen del pago y de las líneas del pedido.
 */

export class FacturacionRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /** RN-18: los datos fiscales del negocio. */
  async obtenerEmisor(cliente = this.#pool) {
    const { rows } = await cliente.query(`SELECT razon_social, cedula_juridica, direccion FROM facturacion.emisor`);
    const fila = rows[0];
    return fila && { razonSocial: fila.razon_social, cedulaJuridica: fila.cedula_juridica, direccion: fila.direccion };
  }

  /** Dentro de la transacción del pedido, después de guardar el pago. */
  async registrar(cliente, { numFactura, numReferencia }) {
    const { rows } = await cliente.query(
      `INSERT INTO facturacion.factura (num_factura, num_referencia) VALUES ($1, $2) RETURNING fecha_emision`,
      [numFactura, numReferencia]
    );
    return { numFactura, numReferencia, fecha: rows[0].fecha_emision };
  }

  /** La factura de un pedido con el monto que se cobró, o null si no tiene. */
  async buscarPorPedido(correoCliente, numCarrito) {
    const { rows } = await this.#pool.query(
      `SELECT f.num_factura, f.fecha_emision, p.num_referencia, p.monto, p.metodo_pago
         FROM facturacion.factura f
         JOIN pagos.pago p ON p.num_referencia = f.num_referencia
        WHERE p.correo_cliente = $1 AND p.num_carrito = $2`,
      [correoCliente, numCarrito]
    );
    const fila = rows[0];
    return (
      fila && {
        numFactura: fila.num_factura,
        fecha: fila.fecha_emision,
        numReferencia: fila.num_referencia,
        montoCobrado: Number(fila.monto),
        metodoPago: fila.metodo_pago,
      }
    );
  }
}
