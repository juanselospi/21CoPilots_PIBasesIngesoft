/**
 * CAPA DE API — Controlador de reportes.
 *
 * POR IMPLEMENTAR
 *   ventasPorProducto   RF-44
 *   ventasPorFamilia    RF-45
 *   pedidosPorCliente   RF-46
 *   exportar            RF-48
 *
 * El período (fecha inicial y final) se valida aquí, no en el servicio:
 * es validación de entrada, no regla de negocio (RF-47).
 */

export class ReportesController {
  #servicio;

  constructor({ servicio }) {
    this.#servicio = servicio;
  }
}
