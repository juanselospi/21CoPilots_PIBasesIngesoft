/**
 * Rutas de clientes.
 */

import { Router } from "express";
import { asincrono } from "../../shared/http/envoltura-async.js";
import { ROLES } from "../../shared/http/autorizacion-por-rol.js";

export function crearRutasDeClientes(controlador, { exigirSesion, exigirRol }) {
  const rutas = Router();

  // Crear cuenta es público: es como alguien se vuelve cliente
  rutas.post("/", asincrono(controlador.registrar));

  // "Mi cuenta": cada cliente ve y corrige solo la suya
  const soloCliente = [exigirSesion, exigirRol(ROLES.CLIENTE)];
  rutas.get("/me", ...soloCliente, asincrono(controlador.verMiCuenta));
  rutas.patch("/me", ...soloCliente, asincrono(controlador.corregirMiCuenta));

  return rutas;
}
