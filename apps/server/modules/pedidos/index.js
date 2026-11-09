/**
 * Facade del módulo de pedidos.
 *
 * Es el módulo con más dependencias: confirmar una compra toca precio,
 * existencias, nivel del cliente, cobro y factura. Todas llegan por
 * parámetro; ninguna se importa como implementación concreta (RNF-20).
 */

import { PedidosRepository } from "./pedidos.repository.js";
import { PedidosService } from "./pedidos.service.js";
import { CarritoService } from "./carrito/carrito.service.js";
import { EdicionDePedidosService } from "./edicion/edicion.service.js";
import { CreditosDePedidos } from "./creditos/creditos-de-pedidos.js";
import { PedidosController } from "./pedidos.controller.js";
import { crearRutasDePedidos } from "./pedidos.routes.js";

export function crearModuloPedidos({
  pool,
  busDeEventos,
  exigirRol,
  inventario,
  clientes,
  motorDePrecios,
  productosParaVenta,
  pasarelaDePago,
  pagos,
  facturas,
  facturacionElectronica,
}) {
  const repositorio = new PedidosRepository({ pool });
  const creditos = new CreditosDePedidos({ pagos, clientes });
  const servicio = new PedidosService({
    repositorio,
    inventario,
    clientes,
    busDeEventos,
    motorDePrecios,
    pasarelaDePago,
    facturacionElectronica,
    productosParaVenta,
    pagos,
    facturas,
    creditos,
  });
  const carrito = new CarritoService({ repositorio, productosParaVenta });
  const edicion = new EdicionDePedidosService({
    repositorio,
    inventario,
    productosParaVenta,
    busDeEventos,
    creditos,
  });
  const controlador = new PedidosController({ servicio, carrito, edicion });

  return {
    rutas: crearRutasDePedidos(controlador, { exigirRol }),
    servicio,
  };
}
