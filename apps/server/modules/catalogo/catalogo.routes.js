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
  rutas.get("/familias", asincrono(controlador.listarFamilias));
  // la tienda todavía pide las familias con este nombre
  rutas.get("/categorias", asincrono(controlador.listarFamilias));

  // listado del panel, incluye los ocultos en la tienda y los costos
  rutas.get("/admin/productos", ...soloAdministrador, asincrono(controlador.listarParaAdministracion));
  rutas.post("/productos", ...soloAdministrador, asincrono(controlador.crear));
  // cambia el precio, las existencias o el contrapedido, lo que no venga se queda igual
  rutas.patch("/productos/:sku", ...soloAdministrador, asincrono(controlador.actualizar));

  // familias del panel, con importación y margen; incluye las inactivas
  rutas.get("/admin/familias", ...soloAdministrador, asincrono(controlador.listarFamiliasParaAdministracion));
  rutas.post("/familias", ...soloAdministrador, asincrono(controlador.crearFamilia));
  rutas.patch("/familias/:nombre", ...soloAdministrador, asincrono(controlador.actualizarFamilia));
  rutas.delete("/familias/:nombre", ...soloAdministrador, asincrono(controlador.eliminarFamilia));

  return rutas;
}
