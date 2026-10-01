/**
 * CAPA DE PERSISTENCIA — Repositorio de carrito y pedidos.
 *
 * PENDIENTE: el EER corregido cambio estas tablas, hay que adaptar antes de implementar
 * (ver cambios-siguiente-sprint.md):
 *   - las tablas son carrito, agrega, oferta, pedido e historial_estado, no hay linea_carrito
 *     ni linea_pedido
 *   - el carrito se identifica por (correo_cliente, num_carrito) y el pedido hereda esa llave
 *   - las lineas viven en agrega con precio_unitario sin impuesto y tasa_impuesto_aplicada
 *     fijados al agregar
 *   - historial_estado es solo insercion y numero_cambio va 1, 2, 3... por pedido
 *   - el estado actual se lee de reportes.v_estado_pedido
 *   - el stock es de catalogo.producto, este repositorio no lo toca
 *
 * Escribe solo en el esquema `pedidos` (§ 9.3): carrito, linea_carrito,
 * pedido, linea_pedido e historial_estado.
 *
 * POR IMPLEMENTAR
 *   obtenerCarrito() / guardarLinea()   RF-21..RF-24 — persiste indefinidamente (RN-14)
 *   crearPedido()                       RF-25 — con líneas y precio copiado (DD-13)
 *   cambiarEstado()                     RF-26, RF-27 — también inserta en historial_estado
 *   listarPorCliente()                  RF-29, RF-37
 *
 * `enTransaccion` está aquí porque confirmar un pedido debe ser atómico:
 * descontar existencias, crear el pedido y registrar el movimiento ocurren
 * juntos o no ocurren (Unit of Work, § 10.2). Los métodos que participan
 * en esa transacción reciben el `cliente` de la conexión como parámetro.
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
