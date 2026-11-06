/**
 * Rutas de administración.
 *
 * Iniciar sesión y recuperar la contraseña son públicas, así que no se
 * puede poner exigirRol en todo el router: cada ruta protegida lo lleva.
 *
 * POST   /sesion
 * GET    /sesion
 * DELETE /sesion
 * PATCH  /contrasena
 * POST   /contrasena/recuperacion
 * POST   /usuarios                 solo el propietario
 * GET    /usuarios                 solo el propietario
 * PATCH  /usuarios/:correo/activo  solo el propietario
 * PATCH  /parametros
 * GET    /bitacora
 * POST   /importaciones
 * GET    /importaciones/plantilla
 *
 */

import { Router } from "express";
import { asincrono } from "../../shared/http/envoltura-async.js";
import { exigirSesion } from "../../shared/http/autenticacion.js";
import { ROLES } from "../../shared/http/autorizacion-por-rol.js";

export function crearRutasDeAdmin(controlador, { exigirRol, exigirPropietario, recibirExcel }) {
  const rutas = Router();
  const soloAdministrador = [exigirSesion, exigirRol(ROLES.ADMINISTRADOR)];
  // Los empleados también son administradores, pero no crean cuentas
  const soloPropietario = [exigirSesion, exigirPropietario];

  rutas.post("/sesion", asincrono(controlador.iniciarSesion));

  // Cualquier rol puede consultar su propia sesion si la tiene
  rutas.get("/sesion", exigirSesion, controlador.consultarSesion);
  rutas.delete("/sesion", asincrono(controlador.cerrarSesion));

  // Cualquier usuario con sesión cambia la suya
  rutas.patch("/contrasena", exigirSesion, asincrono(controlador.cambiarContrasena));

  // Primero se revisan la sesión y el rol, después se recibe el archivo para no cargar en memoria lo que mande alguien sin permiso
  rutas.post(
    "/importaciones",
    ...soloAdministrador,
    recibirExcel,
    asincrono(controlador.importarExcel)
  );
  rutas.get("/importaciones/plantilla", ...soloAdministrador, controlador.descargarPlantilla);

  rutas.get("/bitacora", ...soloAdministrador, asincrono(controlador.listarBitacora));

  rutas.post("/usuarios", ...soloPropietario, asincrono(controlador.crearEmpleado));
  rutas.get("/usuarios", ...soloPropietario, asincrono(controlador.listarAdministradores));
  rutas.patch("/usuarios/:correo/activo", ...soloPropietario, asincrono(controlador.cambiarActivo));

  return rutas;
}
