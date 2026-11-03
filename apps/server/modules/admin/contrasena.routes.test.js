import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";

import { crearRutasDeAdmin } from "./admin.routes.js";
import { AdminController } from "./admin.controller.js";
import { AdminService } from "./admin.service.js";
import { hashearContrasena } from "./seguridad/contrasenas.js";
import { crearIdentificarUsuario, COOKIE_DE_SESION } from "../../shared/http/autenticacion.js";
import { crearExigirRol } from "../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../shared/http/manejador-de-errores.js";

// Servicio real sobre una base en memoria con un cliente, para seguir el
// recorrido completo: iniciar sesión, cambiar la contraseña y volver a entrar.
async function levantarServidor() {
  const usuario = {
    correo: "cliente@correo.test",
    nombre: "Cliente",
    rol: "cliente",
    contrasenaHash: await hashearContrasena("Cliente123!"),
  };
  let sesiones = [];
  const repositorio = {
    buscarUsuarioPorCorreo: async (correo) => (correo === usuario.correo ? { ...usuario } : null),
    borrarSesionesVencidas: async () => {},
    crearSesion: async (sesion) => sesiones.push(sesion),
    buscarUsuarioPorSesion: async (tokenHash) => {
      const sesion = sesiones.find((s) => s.tokenHash === tokenHash);
      return sesion ? { correo: usuario.correo, nombre: usuario.nombre, rol: usuario.rol, venceEn: sesion.venceEn } : null;
    },
    cambiarContrasena: async ({ contrasenaHash, sesionQueSeQueda }) => {
      usuario.contrasenaHash = contrasenaHash;
      sesiones = sesiones.filter((s) => s.tokenHash === sesionQueSeQueda);
    },
  };
  const servicio = new AdminService({ repositorio });

  const aplicacion = express();
  aplicacion.use(express.json());
  aplicacion.use(cookieParser());
  aplicacion.use(crearIdentificarUsuario((token) => servicio.identificarPorToken(token)));
  aplicacion.use(
    "/api/admin",
    crearRutasDeAdmin(new AdminController({ servicio }), {
      exigirRol: crearExigirRol({ publicar: async () => {} }),
      recibirExcel: (_peticion, _respuesta, siguiente) => siguiente(),
    })
  );
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  const base = `http://localhost:${servidor.address().port}/api/admin`;
  return { base, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
}

async function entrar(base, contrasena) {
  const respuesta = await fetch(`${base}/sesion`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ correo: "cliente@correo.test", contrasena }),
  });
  const cookie = respuesta.headers.get("set-cookie");
  return { estado: respuesta.status, token: cookie?.match(/^sesion=([^;]+)/)?.[1] };
}

async function cambiar(base, token, cuerpo) {
  const respuesta = await fetch(`${base}/contrasena`, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...(token ? { cookie: `${COOKIE_DE_SESION}=${token}` } : {}) },
    body: JSON.stringify(cuerpo),
  });
  const texto = await respuesta.text();
  return { estado: respuesta.status, cuerpo: texto ? JSON.parse(texto) : null };
}

const estadoDeLaSesion = async (base, token) =>
  (await fetch(`${base}/sesion`, { headers: { cookie: `${COOKIE_DE_SESION}=${token}` } })).status;

test("RF-49: cambiar la contraseña responde 204, cierra las otras sesiones y la nueva sirve para entrar", async (t) => {
  const { base, cerrar } = await levantarServidor();
  t.after(cerrar);
  const { token: estaSesion } = await entrar(base, "Cliente123!");
  const { token: otraSesion } = await entrar(base, "Cliente123!");

  const { estado } = await cambiar(base, estaSesion, { actual: "Cliente123!", nueva: "Nueva#2026" });

  assert.equal(estado, 204);
  assert.equal(await estadoDeLaSesion(base, estaSesion), 200);
  assert.equal(await estadoDeLaSesion(base, otraSesion), 401);
  assert.equal((await entrar(base, "Nueva#2026")).estado, 201);
  assert.equal((await entrar(base, "Cliente123!")).estado, 401);
});

test("una contraseña nueva sin mayúscula responde 400 con el motivo en el campo nueva", async (t) => {
  const { base, cerrar } = await levantarServidor();
  t.after(cerrar);
  const { token } = await entrar(base, "Cliente123!");

  const { estado, cuerpo } = await cambiar(base, token, { actual: "Cliente123!", nueva: "nueva#2026" });

  assert.equal(estado, 400);
  assert.equal(cuerpo.error.mensaje, "La contraseña debe tener al menos una mayúscula.");
  assert.deepEqual(cuerpo.error.detalles.campos, ["nueva"]);
});

test("la contraseña actual equivocada responde 400 en el campo actual", async (t) => {
  const { base, cerrar } = await levantarServidor();
  t.after(cerrar);
  const { token } = await entrar(base, "Cliente123!");

  const { estado, cuerpo } = await cambiar(base, token, { actual: "Otra123!", nueva: "Nueva#2026" });

  assert.equal(estado, 400);
  assert.deepEqual(cuerpo.error.detalles.campos, ["actual"]);
});

test("sin los dos campos responde 400 y sin sesión 401", async (t) => {
  const { base, cerrar } = await levantarServidor();
  t.after(cerrar);
  const { token } = await entrar(base, "Cliente123!");

  const sinCampos = await cambiar(base, token, { nueva: "" });
  assert.equal(sinCampos.estado, 400);
  assert.deepEqual(sinCampos.cuerpo.error.detalles.campos, ["actual", "nueva"]);
  assert.equal((await cambiar(base, null, { actual: "Cliente123!", nueva: "Nueva#2026" })).estado, 401);
});
