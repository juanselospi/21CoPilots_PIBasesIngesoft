/**
 * CAPA DE PERSISTENCIA — Repositorio de reportes.
 *
 * POR IMPLEMENTAR
 *   ventasPorProducto()    RF-44  — reportes.v_venta_por_producto
 *   ventasPorFamilia()     RF-45  — reportes.v_venta_por_producto agrupada por familia
 *   existencias()          RF-45  — reportes.v_existencias
 *   pedidosPorCliente()    RF-46  — reportes.v_pedidos_por_cliente
 *   registroDeMercancia()  RF-19  — reportes.v_registro_mercancia
 *
 * El estado vigente de cada pedido sale de reportes.v_estado_pedido.
 */

export class ReportesRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }
}
