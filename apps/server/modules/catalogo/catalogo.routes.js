/**
 * Rutas del catálogo.
 * Las de consulta son públicas y las que cambian productos son solo del administrador.
 */

import { Router } from "express";
import { asincrono } from "../../shared/http/envoltura-async.js";
import { exigirSesion } from "../../shared/http/autenticacion.js";
import { ROLES } from "../../shared/http/autorizacion-por-rol.js";

export function crearRutasDeCatalogo(controlador, { exigirRol }) {
  const rutas = Router();
  const soloAdministrador = [exigirSesion, exigirRol(ROLES.ADMINISTRADOR)];

  // el visitante ve el catálogo sin iniciar sesión
  rutas.get("/productos", asincrono(controlador.listar));
  rutas.get("/productos/:sku", asincrono(controlador.obtenerFicha));
  rutas.get("/categorias", asincrono(controlador.listarCategorias));

  // listado del panel, incluye los ocultos en la tienda y los costos
  rutas.get("/admin/productos", ...soloAdministrador, asincrono(controlador.listarParaAdministracion));
  rutas.post("/productos", ...soloAdministrador, asincrono(controlador.crear));
  // cambia el precio, las existencias o el contrapedido, lo que no venga se queda igual
  rutas.patch("/productos/:sku", ...soloAdministrador, asincrono(controlador.actualizar));

  return rutas;
}
