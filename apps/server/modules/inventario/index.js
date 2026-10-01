/**
 * Arma el módulo de inventario y deja salir solo lo que otros módulos
 * necesitan.
 */

import { InventarioRepository } from "./inventario.repository.js";
import { InventarioService } from "./inventario.service.js";
import { InventarioController } from "./inventario.controller.js";
import { crearRutasDeInventario } from "./inventario.routes.js";

export function crearModuloInventario({ pool, busDeEventos, exigirRol }) {
  const repositorio = new InventarioRepository({ pool });
  const servicio = new InventarioService({ repositorio, busDeEventos });
  const controlador = new InventarioController({ servicio });

  return {
    rutas: crearRutasDeInventario(controlador, { exigirRol }),
    // Los pedidos descuentan existencias a través de este servicio y no con SQL propio, y así todos los canales de venta usan el mismo inventario
    servicio,
  };
}
