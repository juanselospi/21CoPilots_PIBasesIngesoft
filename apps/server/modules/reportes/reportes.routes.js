/**
 * Rutas de reportes. Todas son administrativas (RNF-10).
 *
 * Rutas previstas, a confirmar con el equipo antes de fijarlas:
 *   GET /ventas/por-producto     RF-44
 *   GET /ventas/por-familia      RF-45
 *   GET /pedidos/por-cliente     RF-46
 *   GET /exportar                RF-48
 */

import { Router } from "express";
import { exigirSesion } from "../../shared/http/autenticacion.js";
import { ROLES } from "../../shared/http/autorizacion-por-rol.js";

export function crearRutasDeReportes(controlador, { exigirRol }) {
  const rutas = Router();

  // Primero la sesión: sin ella la respuesta tiene que ser 401, no 403.
  rutas.use(exigirSesion, exigirRol(ROLES.ADMINISTRADOR));

  // Las rutas se agregan conforme se implementen los RF de arriba.

  return rutas;
}
