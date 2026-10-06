/**
 * CAPA DE PERSISTENCIA — Repositorio de carrito y pedidos.
 *
 * POR IMPLEMENTAR
 *   obtenerCarrito() / guardarLinea()   RF-21..RF-24 — persiste indefinidamente (RN-14)
 *   crearPedido()                       RF-25 — con líneas y precio copiado (DD-13)
 *   cambiarEstado()                     RF-26, RF-27 — también inserta en historial_estado
 *   listarPorCliente()                  RF-29, RF-37
 */

import { enTransaccion } from "../../shared/db/unidad-de-trabajo.js";

export class PedidosRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /** Unit of Work: ejecuta el trabajo dentro de una sola transacción. */
  enTransaccion(trabajo) {
    return enTransaccion(this.#pool, trabajo);
  }
}
