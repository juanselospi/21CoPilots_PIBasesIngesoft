/**
 * CAPA DE DOMINIO — Inventario. NÚCLEO DEL SISTEMA.
 *
 * POR IMPLEMENTAR
 *   RF-13  Registrar ingreso de mercadería (producto, cantidad, costo)
 *   RF-14  Conservar el histórico de costos sin sobrescribir (RN-06)
 *   RF-15  Registrar movimiento por cualquiera de sus orígenes
 *   RF-17  Registrar venta de canal externo
 *   RF-18  Descontinuar un producto (se pide a la fachada de catalogo)
 *   RF-19  Consultar el historial de movimientos
 *   RF-20  Rechazar ajustes sin justificación
 */

export class InventarioService {
  #repositorio;
  #busDeEventos;

  constructor({ repositorio, busDeEventos }) {
    this.#repositorio = repositorio;
    this.#busDeEventos = busDeEventos;
  }
}
