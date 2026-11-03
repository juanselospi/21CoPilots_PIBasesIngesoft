/**
 * Rutas de inventario por implementar:
 *   POST   /ingresos       RF-13
 *   POST   /ajustes        RF-20
 *   GET    /movimientos    RF-19
 *   GET    /alertas        RF-16
 *
 * Descontinuar un producto vive en catálogo y las ventas de otros canales
 * en pedidos, porque las dos cosas son más que un movimiento de stock.
 */

import { Router } from "express";
import { asincrono } from "../../shared/http/envoltura-async.js";
import { exigirSesion } from "../../shared/http/autenticacion.js";
import { ROLES } from "../../shared/http/autorizacion-por-rol.js";

export function crearRutasDeInventario(controlador, { exigirRol }) {
  const rutas = Router();

  // Primero la sesión: sin ella la respuesta tiene que ser 401, no 403.
  rutas.use(exigirSesion, exigirRol(ROLES.ADMINISTRADOR));

  rutas.get("/alertas", asincrono(controlador.listarAlertas));
  rutas.post("/ingresos", asincrono(controlador.registrarIngreso));
  rutas.post("/ajustes", asincrono(controlador.registrarAjuste));
  rutas.get("/movimientos", asincrono(controlador.listarMovimientos));

  // Las demás rutas se agregan conforme se implementen los RF de arriba.

  return rutas;
}
