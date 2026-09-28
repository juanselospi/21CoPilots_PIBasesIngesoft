/**
 * Facade del módulo de administración (§ 5.3).
 *
 * Expone el repositorio porque el suscriptor de la bitácora lo necesita
 * (la raíz de composición lo registra en el bus después de armar el
 * módulo), y el servicio porque otros módulos le piden los parámetros de
 * negocio.
 */

import { AdminRepository } from "./admin.repository.js";
import { AdminService } from "./admin.service.js";
import { AdminController } from "./admin.controller.js";
import { crearRutasDeAdmin } from "./admin.routes.js";

export function crearModuloAdmin({ pool, busDeEventos, exigirRol, sesion }) {
  const repositorio = new AdminRepository({ pool });
  const servicio = new AdminService({
    repositorio,
    busDeEventos,
    duracionSesionHoras: sesion.duracionHoras,
  });
  const controlador = new AdminController({
    servicio,
    cookieSegura: sesion.cookieSegura,
  });

  return {
    rutas: crearRutasDeAdmin(controlador, { exigirRol }),
    servicio,
    repositorio,
  };
}
