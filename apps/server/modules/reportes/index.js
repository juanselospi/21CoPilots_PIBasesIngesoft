/**
 * Facade del módulo de reportes (§ 5.3).
 */

import { ReportesRepository } from "./reportes.repository.js";
import { ReportesService } from "./reportes.service.js";
import { ReportesController } from "./reportes.controller.js";
import { crearRutasDeReportes } from "./reportes.routes.js";

export function crearModuloReportes({ pool, exigirRol }) {
  const repositorio = new ReportesRepository({ pool });
  const servicio = new ReportesService({ repositorio });
  const controlador = new ReportesController({ servicio });

  return {
    rutas: crearRutasDeReportes(controlador, { exigirRol }),
    servicio,
  };
}
