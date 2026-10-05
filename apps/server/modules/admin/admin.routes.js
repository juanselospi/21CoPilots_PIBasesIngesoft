/**
 * Rutas de administración.
 *
 * Rutas previstas (confirmar con el equipo antes de fijarlas):
 *   POST   /sesion                    pública
 *   GET    /sesion                    listo
 *   DELETE /sesion
 *   POST   /contrasena/recuperacion   pública
 *   POST   /usuarios
 *   PATCH  /parametros
 *   GET    /bitacora
 *   POST   /importaciones             listo
 *   GET    /importaciones/plantilla   listo
 */

import { Router } from "express";
import { asincrono } from "../../shared/http/envoltura-async.js";
import { exigirSesion } from "../../shared/http/autenticacion.js";
import { ROLES } from "../../shared/http/autorizacion-por-rol.js";

export function crearRutasDeAdmin(controlador, { exigirRol, recibirExcel }) {
  const rutas = Router();
  const soloAdministrador = [exigirSesion, exigirRol(ROLES.ADMINISTRADOR)];

  rutas.post("/sesion", asincrono(controlador.iniciarSesion));

  // Cualquier rol puede consultar su propia sesion si la tiene
  rutas.get("/sesion", exigirSesion, controlador.consultarSesion);

  // Primero se revisan la sesión y el rol, después se recibe el archivo para no cargar en memoria lo que mande alguien sin permiso
  rutas.post(
    "/importaciones",
    ...soloAdministrador,
    recibirExcel,
    asincrono(controlador.importarExcel)
  );
  rutas.get("/importaciones/plantilla", ...soloAdministrador, controlador.descargarPlantilla);

  return rutas;
}
