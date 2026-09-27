/**
 * Facade del módulo de clientes (§ 5.3).
 *
 * Recibe `parametrosDeNegocio` (el servicio de admin) porque el monto
 * mínimo de descuento vive en `admin.parametro_negocio`, que no es de este
 * módulo: se pide a su dueño en lugar de leer su esquema (§ 9.3).
 */

import { ClientesRepository } from "./clientes.repository.js";
import { ClientesService } from "./clientes.service.js";
import { ClientesController } from "./clientes.controller.js";
import { crearRutasDeClientes } from "./clientes.routes.js";
import { exigirSesion } from "../../shared/http/autenticacion.js";

export function crearModuloClientes({ pool, parametrosDeNegocio, exigirRol }) {
  const repositorio = new ClientesRepository({ pool });
  const servicio = new ClientesService({ repositorio, parametrosDeNegocio });
  const controlador = new ClientesController({ servicio });

  return {
    rutas: crearRutasDeClientes(controlador, { exigirSesion, exigirRol }),
    // Pedidos lo usa para obtener la estrategia de descuento al confirmar.
    servicio,
  };
}
