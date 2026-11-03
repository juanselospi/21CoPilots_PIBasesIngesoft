/**
 * CAPA DE DOMINIO — Inventario. NÚCLEO DEL SISTEMA.
 *
 * El stock vive en `catalogo.producto.stock` y cada cambio deja una fila
 * en `inventario.producto_administra`. Los productos se identifican por
 * `sku`, también en los eventos.
 *
 * POR IMPLEMENTAR
 *   RF-13  Registrar ingreso de mercadería (producto, cantidad, costo)
 *   RF-14  Conservar el histórico de costos sin sobrescribir (RN-06)
 *   RF-15  Registrar movimiento por cualquiera de sus orígenes
 *   RF-19  Consultar el historial de movimientos
 *   RF-20  Rechazar ajustes sin justificación
 *
 * Pedidos descuenta y repone stock a través de este servicio, también en
 * las ventas de otros canales (RF-17).
 */

export class InventarioService {
  #repositorio;
  #busDeEventos;
  #umbralDeExistenciasBajas;

  constructor({ repositorio, busDeEventos, umbralDeExistenciasBajas = 2 }) {
    this.#repositorio = repositorio;
    this.#busDeEventos = busDeEventos;
    this.#umbralDeExistenciasBajas = umbralDeExistenciasBajas;
  }

  /**
   * RF-16: productos activos en el umbral o por debajo (RN-04). Se calcula del stock
   * en cada consulta, así que un ingreso que lo sube saca al producto solo.
   */
  async listarAlertas() {
    const umbral = this.#umbralDeExistenciasBajas;
    const productos = await this.#repositorio.listarExistenciasBajas(umbral);
    return { umbral, productos };
  }
}
