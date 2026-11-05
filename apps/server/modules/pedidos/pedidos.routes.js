/**
 * Rutas de carrito y pedidos.
 *
 * Un pedido se identifica por el correo del cliente y el número de carrito.
 * Rutas previstas, a confirmar con el equipo antes de fijarlas:
 *   GET    /modalidades                     RF-62  pública
 *   GET    /carrito                         RF-24
 *   POST   /carrito/lineas                  RF-21, RF-22, RF-23
 *   PATCH  /carrito/lineas/:sku             RF-21
 *   DELETE /carrito/lineas/:sku             RF-21
 *   POST   /                                RF-25  confirmar pedido
 *   GET    /:numCarrito                     RF-27  estado del pedido propio
 *   GET    /admin                           RF-46  pedidos para el administrador, con filtros
 *   GET    /admin/:correo/:numCarrito       RF-46  detalle para el administrador
 *   POST   /admin/:correo/:numCarrito/estado  RF-26, RF-28  también cancela
 *   POST   /admin/:correo/:numCarrito/lineas               agregar un producto
 *   PATCH  /admin/:correo/:numCarrito/lineas/:sku          cambiar la cantidad
 *   DELETE /admin/:correo/:numCarrito/lineas/:sku          quitar
 *   POST   /admin/:correo/:numCarrito/lineas/:sku/reemplazo  por uno de igual o menor precio
 *
 * El cliente no cancela sus pedidos: eso lo hace solo el administrador.
 */

import { Router } from "express";
import { asincrono } from "../../shared/http/envoltura-async.js";
import { exigirSesion } from "../../shared/http/autenticacion.js";
import { ROLES } from "../../shared/http/autorizacion-por-rol.js";

export function crearRutasDePedidos(controlador, { exigirRol }) {
  const rutas = Router();

  rutas.get("/modalidades", asincrono(controlador.listarModalidades));

  // El carrito es solo del cliente; sin sesión responde 401 y con otra cuenta 403.
  rutas.use("/carrito", exigirSesion, exigirRol(ROLES.CLIENTE));
  rutas.get("/carrito", asincrono(controlador.verCarrito));
  rutas.post("/carrito/lineas", asincrono(controlador.agregarLinea));
  rutas.patch("/carrito/lineas/:sku", asincrono(controlador.cambiarCantidad));
  rutas.delete("/carrito/lineas/:sku", asincrono(controlador.quitarLinea));

  // Confirmar la compra del carrito; también solo del cliente
  const soloCliente = [exigirSesion, exigirRol(ROLES.CLIENTE)];
  rutas.post("/", ...soloCliente, asincrono(controlador.confirmar));
  rutas.get("/:numCarrito/pagos", ...soloCliente, asincrono(controlador.listarPagos));
  rutas.get("/:numCarrito/factura", ...soloCliente, asincrono(controlador.verFactura));

  // El panel ve los pedidos de todos los clientes
  rutas.use("/admin", exigirSesion, exigirRol(ROLES.ADMINISTRADOR));
  rutas.get("/admin", asincrono(controlador.listarParaAdministracion));
  rutas.get("/admin/:correo/:numCarrito", asincrono(controlador.verParaAdministracion));
  rutas.post("/admin/:correo/:numCarrito/estado", asincrono(controlador.cambiarEstado));
  rutas.post("/admin/:correo/:numCarrito/lineas", asincrono(controlador.agregarLineaAlPedido));
  rutas.patch("/admin/:correo/:numCarrito/lineas/:sku", asincrono(controlador.cambiarCantidadDelPedido));
  rutas.delete("/admin/:correo/:numCarrito/lineas/:sku", asincrono(controlador.quitarLineaDelPedido));
  rutas.post("/admin/:correo/:numCarrito/lineas/:sku/reemplazo", asincrono(controlador.reemplazarLineaDelPedido));

  // Las rutas se agregan conforme se implementen los RF de arriba.

  return rutas;
}
