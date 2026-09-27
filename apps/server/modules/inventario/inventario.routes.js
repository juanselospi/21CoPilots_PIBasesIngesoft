/**
 * Rutas de inventario. Todas son administrativas: ninguna se expone sin
 * pasar antes por `exigirRol` (Chain of Responsibility, § 6.1).
 *
 * Rutas previstas — confirmar el contrato con el equipo antes de fijarlo:
 *   POST   /ingresos              RF-13, RF-14
 *   POST   /ventas-externas       RF-17
 *   GET    /movimientos           RF-19
 *   GET    /alertas               RF-16
 *   PATCH  /productos/:id/descontinuar   RF-18
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
