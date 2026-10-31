/**
 * CAPA DE DOMINIO — Clientes y niveles de fidelidad.
 *
 * Toda cuenta nueva que se registra desde la tienda es de cliente.
 *
 * POR IMPLEMENTAR
 *   RF-32, RF-33  Registro del cliente
 *   RF-34         Cálculo del nivel por recompra (RN-08)
 *   RF-35, RF-36  Descuento y pago adelantado (RN-09, RN-10)
 *   RF-37         Consulta de la cuenta y sus pedidos
 *   RF-38         Aceptación de términos con fecha (RN-19, RNF-16)
 *
 * El descuento sale de `pedidos.oferta` (vigencia, monto mínimo y nivel
 * mínimo), no de un porcentaje fijo por nivel: esa estrategia se hace
 * desde cero cuando se implemente.
 */

export class ClientesService {
  #repositorio;

  constructor({ repositorio }) {
    this.#repositorio = repositorio;
  }
}
