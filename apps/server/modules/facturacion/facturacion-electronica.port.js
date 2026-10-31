/**
 * Facturación electrónica.
 *
 * La solicitud es `{ correoCliente, numCarrito, numReferencia, emisor,
 * receptor, lineas }`. La factura se liga al pago (`num_referencia`) y solo
 * se guarda si se emitió.
 */

export class FacturacionElectronica {
  /**
   * @param {object} _solicitud
   * @returns {Promise<{ estado: string, consecutivo: string | null, motivo: string | null }>}
   */
  async emitir(_solicitud) {
    throw new Error("Sin implementar: emitir()");
  }
}
