/**
 * Facturación electrónica.
 */

export class FacturacionElectronica {
  /**
   * @param {SolicitudDeFactura} _solicitud
   * @returns {Promise<ResultadoDeFactura>}
   */
  async emitir(_solicitud) {
    throw new Error("Sin implementar: emitir()");
  }
}
