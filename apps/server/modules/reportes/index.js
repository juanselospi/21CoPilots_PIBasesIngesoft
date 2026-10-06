/**
 * Facade del módulo de reportes.
 *
 * Recibe el motor de precios del catalogo porque las vistas no traen el precio de venta.
 */

import { ReportesRepository } from "./reportes.repository.js";
import { ReportesService } from "./reportes.service.js";
import { ReportesController } from "./reportes.controller.js";
import { crearRutasDeReportes } from "./reportes.routes.js";

export function crearModuloReportes({ pool, exigirRol, motorDePrecios }) {
  const repositorio = new ReportesRepository({ pool });
  const servicio = new ReportesService({ repositorio, motorDePrecios });
  const controlador = new ReportesController({ servicio });

  return {
    rutas: crearRutasDeReportes(controlador, { exigirRol }),
    servicio,
  };
}
