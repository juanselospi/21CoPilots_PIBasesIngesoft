/**
 * Rutas de carrito y pedidos.
 *
 * PENDIENTE: el carrito pertenece al cliente (pedidos.carrito.correo_cliente), no a usuario_id.
 * El pedido se identifica por el num_carrito del cliente de la sesion, entonces /:id pasa a
 * /:numCarrito, y una linea del carrito se identifica por sku (DELETE /carrito/lineas/:sku).
 *
 * El carrito pertenece a una cuenta (`pedidos.carrito.usuario_id`), así
 * que tanto el carrito como el pedido exigen sesión (RN-14, RF-24).
 *
 * Rutas previstas — confirmar el contrato con el equipo antes de fijarlo:
 *   GET    /carrito                 RF-24
 *   POST   /carrito/lineas          RF-21, RF-22, RF-23
 *   DELETE /carrito/lineas/:id      RF-21
 *   POST   /                        RF-25  confirmar pedido
 *   GET    /:id                     RF-27  estado del pedido
 *   POST   /:id/cancelacion         RF-28
 */

import { Router } from "express";

export function crearRutasDePedidos(controlador, { exigirSesion }) {
  const rutas = Router();

  rutas.use(exigirSesion);

  // Las rutas se agregan conforme se implementen los RF de arriba.

  return rutas;
}
