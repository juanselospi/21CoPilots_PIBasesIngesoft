/**
 * CAPA DE API — Controlador de carrito y pedidos.
 *
 * POR IMPLEMENTAR
 *   verCarrito / agregarLinea / cambiarCantidad / quitarLinea   RF-21..RF-24
 *   confirmar                                                   RF-25
 *   consultarEstado                                             RF-27
 *   listarMisPedidos                                            RF-37
 *   listarParaAdministracion / cambiarEstado                    RF-26, RF-28, RF-46
 */

export class PedidosController {
  #servicio;

  constructor({ servicio }) {
    this.#servicio = servicio;
  }
}
