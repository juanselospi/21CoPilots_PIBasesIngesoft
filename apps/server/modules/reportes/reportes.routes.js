/**
 * Rutas de reportes. Todas son administrativas (RNF-10).
 *
 * Rutas previstas — confirmar el contrato con el equipo antes de fijarlo:
 *   GET /ventas/por-producto     RF-44
 *   GET /ventas/por-familia      RF-45
 *   GET /pedidos/por-cliente     RF-46
 *   GET /exportar                RF-48
 */

import { Router } from "express";
import { ROLES } from "../../shared/http/autorizacion-por-rol.js";

export function crearRutasDeReportes(controlador, { exigirRol }) {
  const rutas = Router();

  rutas.use(exigirRol(ROLES.ADMINISTRADOR));

  // Las rutas se agregan conforme se implementen los RF de arriba.

  return rutas;
}
