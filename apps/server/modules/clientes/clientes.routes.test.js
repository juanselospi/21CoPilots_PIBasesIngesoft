import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { crearRutasDeClientes } from "./clientes.routes.js";
import { ClientesController } from "./clientes.controller.js";
import { ClientesService } from "./clientes.service.js";
import { exigirSesion } from "../../shared/http/autenticacion.js";
import { crearExigirRol } from "../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../shared/http/manejador-de-errores.js";

const VENCE = new Date("2030-01-01T12:00:00Z");

// Servicio real con una base falsa donde cliente@correo.test ya existe.
async function levantarServidor() {
  const repositorio = {
    registrar: async ({ correo }) => (correo === "cliente@correo.test" ? ["correo"] : []),
  };
  const servicio = new ClientesService({
    repositorio,
    hashearContrasena: async (contrasena) => `hash:${contrasena}`,
    abrirSesion: async (usuario) => ({ token: "token-nuevo", venceEn: VENCE, usuario }),
  });

  const aplicacion = express();
  aplicacion.use(express.json());
  aplicacion.use(
    "/api/clientes",
    crearRutasDeClientes(new ClientesController({ servicio }), {
      exigirSesion,
      exigirRol: crearExigirRol({ publicar: async () => {} }),
    })
  );
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  const url = `http://localhost:${servidor.address().port}/api/clientes`;
  return { url, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
}

async function registrar(url, cuerpo) {
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  return { estado: respuesta.status, cookie: respuesta.headers.get("set-cookie"), cuerpo: await respuesta.json() };
}

// Lo mismo que manda la pestaña "Crear cuenta"
const formulario = {
  nombre: "Ana Mora",
  correo: "ana@correo.test",
  contrasena: "Clave#2026",
  cedula: "1-2345-6789",
  telefono: "8888-1234",
  direccion: "Heredia centro",
  aceptaTerminos: true,
};

test("HU-11: crear la cuenta responde 201 con el usuario y deja la cookie de sesión", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cookie, cuerpo } = await registrar(url, formulario);

  assert.equal(estado, 201);
  assert.deepEqual(cuerpo.datos, { correo: "ana@correo.test", nombre: "Ana Mora", rol: "cliente" });
  assert.match(cookie, /^sesion=token-nuevo;/);
  assert.match(cookie, /HttpOnly/);
});

test("sin aceptar los términos responde 400 con el campo", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await registrar(url, { ...formulario, aceptaTerminos: false });

  assert.equal(estado, 400);
  assert.deepEqual(cuerpo.error.detalles.campos, ["aceptaTerminos"]);
});

test("un correo que ya tiene cuenta responde 409 con el campo correo y sin cookie", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cookie, cuerpo } = await registrar(url, { ...formulario, correo: "cliente@correo.test" });

  assert.equal(estado, 409);
  assert.equal(cuerpo.error.codigo, "DATO_DUPLICADO");
  assert.deepEqual(cuerpo.error.detalles.campos, ["correo"]);
  assert.equal(cookie, null);
});

test("crear cuenta no pide sesión", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  assert.notEqual((await registrar(url, formulario)).estado, 401);
});
