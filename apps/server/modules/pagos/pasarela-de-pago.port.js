/**
 * INTERFAZ: Pasarela de pago (la "abstracción" del Bridge).
 *
 * La solicitud de cobro es `{ correoCliente, numCarrito, monto, metodo }`,
 * con el monto en dólares como el resto del sistema. El pedido tiene que
 * existir antes de cobrar porque `pagos.pago` apunta a él.
 *
 * El resultado es `{ resultado, referencia, motivo }`. Un `no_disponible`
 * se guarda como `pendiente`, que es lo que admite la base.
 */

export class PasarelaDePago {
  /**
   * @param {{ correoCliente: string, numCarrito: number, monto: number, metodo: string }} _solicitud
   * @returns {Promise<{ resultado: string, referencia: string | null, motivo: string | null }>}
   */
  async cobrar(_solicitud) {
    throw new Error("Sin implementar: cobrar()");
  }

  /**
   * Consulta diferida del estado de un cobro (RF-40).
   * @param {string} _referencia
   * @returns {Promise<{ resultado: string, referencia: string | null, motivo: string | null }>}
   */
  async consultarEstado(_referencia) {
    throw new Error("Sin implementar: consultarEstado()");
  }
}
