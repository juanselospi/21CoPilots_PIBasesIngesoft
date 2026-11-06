import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";

import { crearRutasDeAdmin } from "./admin.routes.js";
import { AdminController } from "./admin.controller.js";
import { crearIdentificarUsuario, COOKIE_DE_SESION } from "../../shared/http/autenticacion.js";
import { crearExigirPropietario, crearExigirRol, ROLES } from "../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../shared/http/manejador-de-errores.js";

// Sesiones vigentes, por token. Cualquier otro token no identifica a nadie.
const USUARIOS_POR_TOKEN = {
  "token-admin": { correo: "admin@dchobbies.test", nombre: "Administración", rol: ROLES.ADMINISTRADOR, esPropietario: true },
  "token-cliente": { correo: "cliente@correo.test", nombre: "Cliente", rol: ROLES.CLIENTE, esPropietario: false },
};

// Una sesión que el servidor renueva al usarla, hasta esta fecha.
const RENOVADA_HASTA = new Date("2030-01-01T12:00:00Z");

// Levanta las rutas reales de admin detrás de la misma cadena que app.js:
// cookie → identificarUsuario → rutas → manejador de errores.
async function levantarServidor() {
  const accesosDenegados = [];
  const sesiones = new Map(Object.entries(USUARIOS_POR_TOKEN));
  sesiones.set("token-por-vencer", USUARIOS_POR_TOKEN["token-admin"]);

  const identificar = async (token) => {
    const usuario = sesiones.get(token);
    if (!usuario) return null;
    return { usuario, renovadaHasta: token === "token-por-vencer" ? RENOVADA_HASTA : null };
  };
  const servicio = {
    cerrarSesion: async (token) => sesiones.delete(token),
    listarBitacora: async () => ({
      registros: [
        {
          correoUsuario: "admin@dchobbies.test",
          fecha: "2026-11-03T18:00:00.000Z",
          evento: "parametro_modificado",
          entidad: "familia",
          entidadId: "Legos",
          valorAnterior: { margenGanancia: 18 },
          valorNuevo: { margenGanancia: 25 },
        },
      ],
      total: 1,
      pagina: 0,
      limite: 50,
    }),
  };

  const aplicacion = express();
  aplicacion.use(cookieParser());
  aplicacion.use(crearIdentificarUsuario(identificar));
  aplicacion.use(
    "/api/admin",
    crearRutasDeAdmin(new AdminController({ servicio }), {
      exigirRol: crearExigirRol({ publicar: async (evento) => accesosDenegados.push(evento) }),
      exigirPropietario: crearExigirPropietario({ publicar: async (evento) => accesosDenegados.push(evento) }),
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

async function cerrarSesion(url, token) {
  const respuesta = await fetch(url, {
    method: "DELETE",
    headers: token ? { cookie: `${COOKIE_DE_SESION}=${token}` } : {},
  });
  return { estado: respuesta.status, cookie: respuesta.headers.get("set-cookie") };
}

test("RF-53: cerrar sesión borra la cookie y después responde 401", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cookie } = await cerrarSesion(url, "token-admin");

  assert.equal(estado, 204);
  assert.match(cookie, /^sesion=;/);
  assert.match(cookie, /Expires=Thu, 01 Jan 1970/);
  assert.equal((await consultarSesion(url, "token-admin")).estado, 401);
});

test("cerrar sesión sin cookie también responde 204", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  assert.equal((await cerrarSesion(url)).estado, 204);
});

test("una sesión renovada devuelve la cookie con el vencimiento nuevo", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const respuesta = await fetch(url, { headers: { cookie: `${COOKIE_DE_SESION}=token-por-vencer` } });
  const cookie = respuesta.headers.get("set-cookie");

  assert.equal(respuesta.status, 200);
  assert.match(cookie, /^sesion=token-por-vencer;/);
  assert.match(cookie, new RegExp(`Expires=${RENOVADA_HASTA.toUTCString()}`));
  assert.match(cookie, /HttpOnly/);
});

test("una sesión que no se renueva no reescribe la cookie", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const respuesta = await fetch(url, { headers: { cookie: `${COOKIE_DE_SESION}=token-admin` } });

  assert.equal(respuesta.headers.get("set-cookie"), null);
});

test("la bitácora es solo del administrador y viene paginada", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);
  const bitacora = url.replace("/sesion", "/bitacora");
  const pedir = (token) => fetch(bitacora, { headers: token ? { cookie: `${COOKIE_DE_SESION}=${token}` } : {} });

  assert.equal((await pedir()).status, 401);
  assert.equal((await pedir("token-cliente")).status, 403);
  const respuesta = await pedir("token-admin");
  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 200);
  assert.deepEqual(cuerpo.meta, { total: 1, pagina: 0, limite: 50 });
  assert.equal(cuerpo.datos[0].usuario, "admin@dchobbies.test");
  assert.deepEqual(cuerpo.datos[0].valorNuevo, { margenGanancia: 25 });
});

// Test de la consulta de la sesión actual hecho con la ayuda de Claude
