/**
 * CAPA DE DOMINIO — Reportes.
 *
 * POR IMPLEMENTAR
 *   RF-44, RF-45  Ventas por producto y por familia
 *   RF-46         Pedidos por cliente
 *   RF-47         Mismo reporte en distintos períodos
 *   RF-48         Exportación
 *
 * Reglas al implementar:
 *   · Los reportes solo leen. No corrigen ni recalculan datos.
 *   · Las vistas no traen precio de venta (DD-13): si un reporte lo
 *     necesita, se calcula con el motor de precios de catalogo.
 *   · Las consultas de un mismo reporte pueden lanzarse concurrentemente
 *     (Parallel Task, § 8): solapa las esperas de entrada/salida.
 *   · Un reporte pesado no debe bloquear la capa síncrona (§ 7.2).
 */

export class ReportesService {
  #repositorio;
  #motorDePrecios;

  constructor({ repositorio, motorDePrecios }) {
    this.#repositorio = repositorio;
    this.#motorDePrecios = motorDePrecios;
  }
}
