/**
 * CAPA DE PERSISTENCIA — Repositorio de reportes.
 *
 * POR IMPLEMENTAR
 *   ventasPorProducto()    RF-44  — reportes.v_venta_por_linea
 *   ventasPorFamilia()     RF-45  — reportes.v_venta_por_linea (por categoría)
 *   existencias()          RF-45  — reportes.v_existencias
 *   pedidosPorCliente()    RF-46  — reportes.v_pedidos_por_cliente
 *   historicoDeCostos()    RN-06  — reportes.v_historico_costos
 */

export class ReportesRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }
}
