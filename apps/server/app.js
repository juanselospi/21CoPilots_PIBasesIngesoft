/**
 * Capa de API: arma la aplicación Express.
 *
 * Solo sabe de HTTP —rutas, middlewares y códigos de estado—. No contiene
 * reglas de negocio ni consultas a la base de datos: delega en los
 * módulos que recibe ya construidos.
 *
 * La cadena de middlewares es un Chain of Responsibility (§ 6.1): cada
 * eslabón decide si atiende la petición o la pasa al siguiente.
 *
 *   identificarUsuario → rutas de cada módulo → rutaNoEncontrada
 *                                             → manejadorDeErrores
 *
 * La interfaz (apps/client) se sirve aparte con Vite; este proceso solo
 * responde JSON bajo /api.
 */

import express from "express";
import { identificarUsuario } from "./shared/http/autenticacion.js";
import { manejadorDeErrores } from "./shared/http/manejador-de-errores.js";
import { rutaNoEncontrada } from "./shared/http/ruta-no-encontrada.js";

export function crearAplicacion(sistema) {
  const aplicacion = express();

  aplicacion.use(express.json({ limit: "1mb" }));

  // Deja al usuario identificado en la petición si trae credencial.
  // No bloquea: exigir sesión o rol es decisión de cada ruta.
  aplicacion.use(identificarUsuario);

  // Verificación de vida (RNF-04). Informa también si hay conexión con
  // PostgreSQL, que es lo primero que falla al levantar el entorno.
  aplicacion.get("/api/salud", async (_peticion, respuesta) => {
    const baseDeDatos = await sistema
      .verificarBaseDeDatos()
      .then(() => "conectada")
      .catch(() => "sin conexion");

    respuesta.json({
      estado: "arriba",
      baseDeDatos,
      fecha: new Date().toISOString(),
    });
  });

  // ---- Módulos de negocio ----
  // Se montan aquí conforme se agregan: aplicacion.use("/api/<modulo>", ...).

  // Cualquier ruta que nadie atendió termina aquí, con el mismo formato
  // de error que el resto de la API.
  aplicacion.use(rutaNoEncontrada);
  aplicacion.use(manejadorDeErrores);

  return aplicacion;
}
