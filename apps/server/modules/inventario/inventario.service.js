/**
 * CAPA DE DOMINIO — Inventario. NÚCLEO DEL SISTEMA.
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
 *     tomando antes los candados con `repositorio.bloquearExistencias`.
 *   · RN-13: validar que haya existencias antes de descontar. El CHECK
 *     (cantidad >= 0) de la tabla es solo la segunda línea de defensa.
 *   · Después del COMMIT, publicar MOVIMIENTO_REGISTRADO en el bus con
 *     { productoId, sku, existenciasResultantes }. La alerta de RF-16 y la
 *     bitácora de RF-52 ya están escuchando; este servicio no debe
 *     llamarlas directamente (Observer, § 6.2).
 */

export class InventarioService {
  #repositorio;
  #busDeEventos;

  constructor({ repositorio, busDeEventos }) {
    this.#repositorio = repositorio;
    this.#busDeEventos = busDeEventos;
  }
}
