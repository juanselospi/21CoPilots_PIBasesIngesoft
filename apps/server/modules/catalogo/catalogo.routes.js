/**
 * Rutas del catálogo. Son públicas: el visitante no autenticado navega
 * el catálogo (RF-10, RF-11, RF-12).
 */

import { Router } from "express";
import { asincrono } from "../../shared/http/envoltura-async.js";

export function crearRutasDeCatalogo(controlador) {
  const rutas = Router();

  rutas.get("/productos", asincrono(controlador.listar));
  rutas.get("/productos/:id", asincrono(controlador.obtenerFicha));
  rutas.get("/categorias", asincrono(controlador.listarCategorias));

  return rutas;
}
