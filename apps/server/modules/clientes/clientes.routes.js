/**
 * Rutas de clientes.
 *
 * PENDIENTE: el cliente se identifica por su correo, PATCH /:id pasa a PATCH /:correo.
 *
 * Rutas previstas — confirmar el contrato con el equipo antes de fijarlo:
 *   GET  /yo                RF-37   exige sesión
 *   POST /yo/terminos       RF-38   exige sesión
 *   GET  /                  aprobado #2   solo administrador
 *   PATCH /:id              aprobado #3   solo administrador
 */

import { Router } from "express";

export function crearRutasDeClientes(controlador, { exigirSesion, exigirRol }) {
  const rutas = Router();

  // Las rutas se agregan conforme se implementen los RF de arriba.

  return rutas;
}
