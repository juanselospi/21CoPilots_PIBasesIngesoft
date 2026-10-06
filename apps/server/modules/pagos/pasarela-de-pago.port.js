/**
 * INTERFAZ — Pasarela de pago (la "abstracción" del Bridge, § 5.2).
 */

export class PasarelaDePago {
  /**
   * @param {SolicitudDeCobro} _solicitud
   * @returns {Promise<ResultadoDeCobro>}
   */
  async cobrar(_solicitud) {
    throw new Error("Sin implementar: cobrar()");
  }

  /**
   * Consulta diferida del estado de un cobro (RF-40).
   * @param {string} _referencia
   * @returns {Promise<ResultadoDeCobro>}
   */
  async consultarEstado(_referencia) {
    throw new Error("Sin implementar: consultarEstado()");
  }
}
