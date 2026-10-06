/**
 * CAPA DE DOMINIO — Clientes y niveles de fidelidad.
 *
 * POR IMPLEMENTAR
 *   RF-32, RF-33  Registro del cliente en su primera compra (RN-07)
 *   RF-34         Cálculo del nivel por recompra (RN-08)
 *   RF-35, RF-36  Descuento por nivel y pago adelantado (RN-09, RN-10)
 *   RF-37         Consulta de la cuenta y sus pedidos
 *   RF-38         Aceptación de términos con fecha (RN-19, RNF-16)
 */

export class ClientesService {
  #repositorio;

  constructor({ repositorio }) {
    this.#repositorio = repositorio;
  }
}
