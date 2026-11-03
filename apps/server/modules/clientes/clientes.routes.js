/**
 * Rutas de clientes.
 */

import { Router } from "express";
import { asincrono } from "../../shared/http/envoltura-async.js";

export function crearRutasDeClientes(controlador, { exigirSesion, exigirRol }) {
  const rutas = Router();

  // Crear cuenta es público: es como alguien se vuelve cliente
  rutas.post("/", asincrono(controlador.registrar));

  // Las demás rutas se agregan conforme se implementen los RF.

  return rutas;
}
