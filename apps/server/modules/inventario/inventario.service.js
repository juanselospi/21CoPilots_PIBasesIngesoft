/**
 * CAPA DE DOMINIO — Inventario. NÚCLEO DEL SISTEMA.
 *
 * PENDIENTE: adaptar al EER corregido antes de implementar (ver cambios-siguiente-sprint.md):
 *   - el candado se toma sobre catalogo.producto ordenado por sku, a traves de la fachada de catalogo
 *   - MOVIMIENTO_REGISTRADO lleva { sku, existenciasResultantes }, sin productoId
 *   - no hay suscriptor de bitacora hasta definir donde se guarda
 *   - solo el administrador queda en producto_administra, las ventas de un pedido
 *     solo descuentan el stock
 *   - RF-14, RF-17, RF-18 y RF-20 dependen de decisiones del modelo que siguen pendientes
 *
 * RES-07 y RN-05: el inventario es único y compartido entre el comercio
 * electrónico, las redes sociales y la venta presencial. Ninguna venta
 * puede quedar fuera, así que toda ruta que mueva existencias —pedido en
 * línea, venta de otro canal, ajuste manual— pasa por este servicio.
 *
 * POR IMPLEMENTAR
 *   RF-13  Registrar ingreso de mercadería (producto, cantidad, costo)
 *   RF-14  Conservar el histórico de costos sin sobrescribir (RN-06)
 *   RF-15  Registrar movimiento por cualquiera de sus orígenes
 *   RF-17  Registrar venta de canal externo
 *   RF-18  Descontinuar un producto (se pide a la fachada de catalogo)
 *   RF-19  Consultar el historial de movimientos
 *   RF-20  Rechazar ajustes sin justificación
 *
 * Reglas al implementar (§ 15, convención 3):
 *   · Todo movimiento se hace dentro de `repositorio.enTransaccion` y
 *     tomando antes el candado del stock.
 *   · RN-13: validar que haya existencias antes de descontar. El CHECK
 *     (cantidad >= 0) de la tabla es solo la segunda línea de defensa.
 *   · Después del COMMIT, publicar MOVIMIENTO_REGISTRADO en el bus con
 *     { sku, existenciasResultantes }. La alerta de RF-16 ya esta escuchando,
 *     este servicio no debe llamarla directamente (Observer, § 6.2).
 */

export class InventarioService {
  #repositorio;
  #busDeEventos;

  constructor({ repositorio, busDeEventos }) {
    this.#repositorio = repositorio;
    this.#busDeEventos = busDeEventos;
  }
}
