/**
 * Rutas de inventario por implementar:
 *   POST   /ingresos
 *   POST   /ventas-externas
 *   GET    /movimientos
 *   GET    /alertas
 *   PATCH  /productos/:id/descontinuar
 */

import { Router } from "express";
import { ROLES } from "../../shared/http/autorizacion-por-rol.js";

export function crearRutasDeInventario(controlador, { exigirRol }) {
  const rutas = Router();

  // Toda ruta de este módulo exige rol de administrador.
  rutas.use(exigirRol(ROLES.ADMINISTRADOR));

  // Las rutas se agregan conforme se implementen los RF de arriba.

  return rutas;
}
