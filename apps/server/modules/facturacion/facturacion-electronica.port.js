/**
 * INTERFAZ — Facturación electrónica (la "abstracción" del Bridge, § 5.2).
 *
 * Segundo contrato exigido por RNF-20. La factura debe contener los datos
 * fiscales de la sociedad y la cédula física o jurídica del cliente
 * (RN-18, RES-04, RNF-18), aunque su emisión sea un placeholder.
 *
 * Los nombres siguen las columnas de `facturacion.factura`, y `estado`
 * usa los valores de su CHECK, así el resultado se guarda tal cual.
 *
 * @typedef {Object} Emisor
 * @property {string} razonSocial     parámetro emisor_razon_social
 * @property {string} cedulaJuridica  parámetro emisor_cedula_juridica
 *
 * @typedef {Object} Receptor
 * @property {string} nombre
 * @property {string} cedula          física o jurídica
 *
 * @typedef {Object} LineaDeFactura
 * @property {string} descripcion
 * @property {number} cantidad
 * @property {number} precioUnitario  sin impuesto, en colones
 *
 * @typedef {Object} SolicitudDeFactura
 * @property {number} pedidoId
 * @property {Emisor} emisor
 * @property {Receptor} receptor
 * @property {LineaDeFactura[]} lineas
 *
 * @typedef {Object} ResultadoDeFactura
 * @property {'pendiente'|'emitida'|'rechazada'} estado
 * @property {string|null} consecutivo
 * @property {string|null} motivo
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
