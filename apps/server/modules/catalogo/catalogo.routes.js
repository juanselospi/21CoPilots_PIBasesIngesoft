/**
 * Rutas del catálogo. Las de consulta son públicas, porque el visitante
 * navega el catálogo sin iniciar sesión (RF-10, RF-11, RF-12). Las que
 * cambian productos son solo para el administrador.
 */

import { Router } from "express";
import { asincrono } from "../../shared/http/envoltura-async.js";
import { exigirSesion } from "../../shared/http/autenticacion.js";
import { ROLES } from "../../shared/http/autorizacion-por-rol.js";

export function crearRutasDeCatalogo(controlador, { exigirRol }) {
  const rutas = Router();
  const soloAdministrador = [exigirSesion, exigirRol(ROLES.ADMINISTRADOR)];

  rutas.get("/productos", asincrono(controlador.listar));
  rutas.get("/productos/:sku", asincrono(controlador.obtenerFicha));
  rutas.get("/categorias", asincrono(controlador.listarCategorias));

  rutas.post("/productos", ...soloAdministrador, asincrono(controlador.crear));

  return rutas;
}
