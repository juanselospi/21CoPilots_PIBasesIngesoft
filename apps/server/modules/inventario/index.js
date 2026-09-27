/**
 * Facade del módulo de inventario (§ 5.3).
 *
 * Ensambla las capas en el orden documentado —repositorio → servicio →
 * controlador → rutas— y expone hacia afuera solo lo necesario.
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
    // Los pedidos descuentan existencias a través de este servicio,
    // nunca con SQL propio (RES-07).
    servicio,
  };
}
