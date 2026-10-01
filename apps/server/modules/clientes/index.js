/**
 * Facade del módulo de clientes (§ 5.3).
 */

import { ClientesRepository } from "./clientes.repository.js";
import { ClientesService } from "./clientes.service.js";
import { ClientesController } from "./clientes.controller.js";
import { crearRutasDeClientes } from "./clientes.routes.js";
import { exigirSesion } from "../../shared/http/autenticacion.js";

export function crearModuloClientes({ pool, exigirRol }) {
  const repositorio = new ClientesRepository({ pool });
  const servicio = new ClientesService({ repositorio });
  const controlador = new ClientesController({ servicio });

  return {
    rutas: crearRutasDeClientes(controlador, { exigirSesion, exigirRol }),
    // Pedidos lo va a usar al confirmar un pedido
    servicio,
  };
}
