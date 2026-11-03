/**
 * Facade del módulo de pedidos (§ 5.3).
 *
 * Es el módulo con más dependencias: confirmar una compra toca precio,
 * existencias, nivel del cliente, cobro y factura. Todas llegan por
 * parámetro; ninguna se importa como implementación concreta (RNF-20).
 */

import { PedidosRepository } from "./pedidos.repository.js";
import { PedidosService } from "./pedidos.service.js";
import { PedidosController } from "./pedidos.controller.js";
import { crearRutasDePedidos } from "./pedidos.routes.js";

export function crearModuloPedidos({
  pool,
  busDeEventos,
  exigirRol,
  inventario,
  clientes,
  motorDePrecios,
  pasarelaDePago,
  facturacionElectronica,
}) {
  const repositorio = new PedidosRepository({ pool });
  const servicio = new PedidosService({
    repositorio,
    inventario,
    clientes,
    busDeEventos,
    motorDePrecios,
    pasarelaDePago,
    facturacionElectronica,
  });
  const controlador = new PedidosController({ servicio });

  return {
    rutas: crearRutasDePedidos(controlador, { exigirRol }),
    servicio,
  };
}
