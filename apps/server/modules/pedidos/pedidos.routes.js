/**
 * Rutas de carrito y pedidos.
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
