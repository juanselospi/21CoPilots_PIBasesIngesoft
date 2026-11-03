/**
 * CAPA DE PERSISTENCIA — Repositorio de carrito y pedidos.
 *
 * El pedido se identifica por `(correo_cliente, num_carrito)`. Las líneas
 * viven en `agrega` con el precio sin impuesto y la tasa del momento, y el
 * estado vigente se lee de `reportes.v_estado_pedido`, no de una columna.
 *
 * POR IMPLEMENTAR
 *   obtenerCarrito() / guardarLinea()   RF-21..RF-24 — persiste indefinidamente (RN-14)
 *   crearPedido()                       RF-25 — carrito a `convertido` con `fecha_cierre`
 *   cambiarEstado()                     RF-26, RF-27 — inserta en historial_estado
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
