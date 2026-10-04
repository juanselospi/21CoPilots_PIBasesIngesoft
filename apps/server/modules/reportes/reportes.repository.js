/**
 * CAPA DE PERSISTENCIA — Repositorio de reportes.
 *
 * PENDIENTE: las vistas reales de la migracion 009 son v_venta_por_producto, v_existencias,
 * v_pedidos_por_cliente, v_registro_mercancia y v_estado_pedido. v_venta_por_linea y
 * v_historico_costos no existen, y RN-06 sigue por definir (ver cambios-siguiente-sprint.md).
 *
 * Solo lectura: consulta las vistas del esquema `reportes` (migración
 * 009) y nunca escribe ni corrige datos (§ 9.3).
 *
 * POR IMPLEMENTAR
 *   ventasPorProducto()    RF-44  — reportes.v_venta_por_linea
 *   ventasPorFamilia()     RF-45  — reportes.v_venta_por_linea (por categoría)
 *   existencias()          RF-45  — reportes.v_existencias
 *   pedidosPorCliente()    RF-46  — reportes.v_pedidos_por_cliente
 *   historicoDeCostos()    RN-06  — reportes.v_historico_costos
 *
 * El período (RF-47) se aplica con WHERE sobre la fecha de cada vista.
 * RNF-03 exige responder en 5 s o menos sobre el histórico completo; si
 * una consulta no llega, primero índices y luego vistas materializadas.
 */

export class ReportesRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }
}
