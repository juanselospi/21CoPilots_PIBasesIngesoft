/**
 * Rutas de administración.
 *
 * Las de sesión son públicas por definición; el resto exige rol
 * administrador (Chain of Responsibility, § 6.1).
 *
 * RF-53 y RF-54 son públicas: no montar `exigirRol` en todo el router.
 *
 * Rutas previstas — confirmar el contrato con el equipo antes de fijarlo:
 *   POST   /sesion                  RF-53   pública
 *   DELETE /sesion                  aprobado #15
 *   POST   /contrasena/recuperacion RF-54   pública
 *   POST   /usuarios                RF-49, aprobado #6
 *   PATCH  /parametros              RF-51
 *   GET    /bitacora                RF-52
 *   POST   /importaciones           RF-57, RF-58, RF-59
 */

import { Router } from "express";
import { asincrono } from "../../shared/http/envoltura-async.js";

export function crearRutasDeAdmin(controlador, { exigirRol }) {
  const rutas = Router();

  rutas.post("/sesion", asincrono(controlador.iniciarSesion));

  // Las rutas se agregan conforme se implementen los RF de arriba.
  // Las protegidas se montan detrás de exigirRol(ROLES.ADMINISTRADOR).

  return rutas;
}
