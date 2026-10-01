/**
 * INTERFAZ — Pasarela de pago (la "abstracción" del Bridge, § 5.2).
 *
 * PENDIENTE: adaptar al EER corregido antes de implementar (ver cambios-siguiente-sprint.md):
 *   - la tabla es pagos.pago y no intento_pago, la referencia es num_referencia (llave primaria)
 *   - SolicitudDeCobro usa { correoCliente, numCarrito } del pedido en lugar de pedidoId y
 *     carritoId, porque el pago necesita que el pedido ya exista
 *   - el CHECK de estado_pago solo admite pendiente, aprobado y rechazado, no_disponible se
 *     guarda como pendiente
 *   - un pago sin referencia todavia no se puede guardar, en este sprint se asume que siempre hay una
 *
 * RNF-20: "la lógica de pedidos no debe referenciar directamente ninguna
 * implementación concreta de pago". Este archivo es ese contrato. El
 * módulo de pedidos solo conoce estos métodos; cuál adaptador se usa lo
 * decide `composicion.js`.
 *
 * Los valores de `metodo` y `resultado` son los que admiten los CHECK de
 * `pagos.intento_pago`, así el resultado se guarda tal cual.
 *
 * RNF-09: por aquí NO circula ningún dato de tarjeta. El adaptador real
 * trabajará con una referencia emitida por el procesador; la base de
 * datos ni siquiera tiene columna para guardarlos.
 *
 * @typedef {Object} SolicitudDeCobro
 * @property {number|null} pedidoId
 * @property {number|null} carritoId  RF-39: un pago rechazado no crea pedido
 * @property {number} monto           en colones (RNF-17)
 * @property {'tarjeta'|'sinpe_movil'|'efectivo'|'datafono'|'contra_entrega'} metodo
 *
 * @typedef {Object} ResultadoDeCobro
 * @property {'pendiente'|'aprobado'|'rechazado'|'no_disponible'} resultado
 * @property {string|null} referencia  identificador del procesador
 * @property {string|null} motivo      razón del rechazo o de la indisponibilidad
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
