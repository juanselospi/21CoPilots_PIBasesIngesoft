import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";

import { crearRutasDeAdmin } from "./admin.routes.js";
import { AdminController } from "./admin.controller.js";
import { crearIdentificarUsuario, COOKIE_DE_SESION } from "../../shared/http/autenticacion.js";
import { crearExigirRol, ROLES } from "../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../shared/http/manejador-de-errores.js";

// Sesiones vigentes, por token. Cualquier otro token no identifica a nadie.
const USUARIOS_POR_TOKEN = {
  "token-admin": { correo: "admin@dchobbies.test", nombre: "Administración", rol: ROLES.ADMINISTRADOR },
  "token-cliente": { correo: "cliente@correo.test", nombre: "Cliente", rol: ROLES.CLIENTE },
};

// Levanta las rutas reales de admin detrás de la misma cadena que app.js:
// cookie → identificarUsuario → rutas → manejador de errores.
async function levantarServidor() {
  const accesosDenegados = [];
  const aplicacion = express();
  aplicacion.use(cookieParser());
  aplicacion.use(crearIdentificarUsuario(async (token) => USUARIOS_POR_TOKEN[token] ?? null));
  aplicacion.use(
    "/api/admin",
    crearRutasDeAdmin(new AdminController({ servicio: {} }), {
      exigirRol: crearExigirRol({ publicar: async (evento) => accesosDenegados.push(evento) }),
      recibirExcel: (_peticion, _respuesta, siguiente) => siguiente(),
    })
  );
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  const url = `http://localhost:${servidor.address().port}/api/admin/sesion`;
  return { url, accesosDenegados, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
}

async function consultarSesion(url, token) {
  const respuesta = await fetch(url, {
    headers: token ? { cookie: `${COOKIE_DE_SESION}=${token}` } : {},
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}

test("RF-50: con sesión de administrador devuelve su nombre y rol", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await consultarSesion(url, "token-admin");

  assert.equal(estado, 200);
  assert.deepEqual(cuerpo.datos, USUARIOS_POR_TOKEN["token-admin"]);
});

test("un cliente con sesión también consulta la suya, sin registrar acceso denegado", async (t) => {
  const { url, accesosDenegados, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await consultarSesion(url, "token-cliente");

  assert.equal(estado, 200);
  assert.equal(cuerpo.datos.rol, ROLES.CLIENTE);
  assert.deepEqual(accesosDenegados, []);
});

test("sin cookie responde 401", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await consultarSesion(url);

  assert.equal(estado, 401);
  assert.equal(cuerpo.error.codigo, "NO_AUTENTICADO");
});

test("con una cookie que no corresponde a ninguna sesión responde 401", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado } = await consultarSesion(url, "token-inventado");
  assert.equal(estado, 401);
});

// Test de la consulta de la sesión actual hecho con la ayuda de Claude
