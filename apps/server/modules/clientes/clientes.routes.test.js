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
  const cuenta = {
    correo: "cliente@correo.test",
    nombre: "Cliente",
    cedula: "111111111",
    direccion: "San Pedro",
    telefonos: ["8888-0001"],
    numeroDeCompras: 0,
    fechaAceptacionTerminos: null,
  };
  const repositorio = {
    registrar: async ({ correo }) => (correo === "cliente@correo.test" ? ["correo"] : []),
    obtenerPorCorreo: async (correo) => (correo === cuenta.correo ? { ...cuenta } : null),
    buscarClientes: async () => [{ ...cuenta, contrasena: "hash" }],
    actualizarContacto: async (_correo, cambios) => Object.assign(cuenta, cambios),
    saldoDeCredito: async () => ({ otorgado: 0, usado: 0, saldo: 0 }),
    movimientosDeCredito: async () => [],
  };
  const servicio = new ClientesService({
    repositorio,
    hashearContrasena: async (contrasena) => `hash:${contrasena}`,
    abrirSesion: async (usuario) => ({ token: "token-nuevo", venceEn: VENCE, usuario }),
  });

  const aplicacion = express();
  aplicacion.use(express.json());
  // La cabecera x-rol simula la sesión del cliente de prueba
  aplicacion.use((peticion, _respuesta, siguiente) => {
    const rol = peticion.get("x-rol");
    peticion.usuario = rol ? { correo: "cliente@correo.test", rol } : null;
    siguiente();
  });
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

// Mi cuenta

const miCuenta = (url, { rol, metodo = "GET", cuerpo } = {}) =>
  fetch(`${url}/me`, {
    method: metodo,
    headers: { "content-type": "application/json", ...(rol ? { "x-rol": rol } : {}) },
    body: cuerpo && JSON.stringify(cuerpo),
  });

test("Mi cuenta es solo del cliente: sin sesión 401 y un administrador 403", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  assert.equal((await miCuenta(url)).status, 401);
  assert.equal((await miCuenta(url, { rol: "administrador" })).status, 403);
});

test("el cliente ve sus datos y corrige la dirección y los teléfonos", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const antes = await (await miCuenta(url, { rol: "cliente" })).json();
  assert.equal(antes.datos.direccion, "San Pedro");
  assert.equal(antes.datos.cedula, "111111111");
  assert.equal(antes.datos.saldoCredito, 0);

  const respuesta = await miCuenta(url, {
    rol: "cliente",
    metodo: "PATCH",
    cuerpo: { direccion: "Heredia", telefonos: ["8888 0002"] },
  });
  const { datos } = await respuesta.json();

  assert.equal(respuesta.status, 200);
  assert.equal(datos.direccion, "Heredia");
  assert.deepEqual(datos.telefonos, ["8888-0002"]);
});

test("intentar cambiar la cédula desde Mi cuenta responde 400", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const respuesta = await miCuenta(url, { rol: "cliente", metodo: "PATCH", cuerpo: { cedula: "222222222" } });

  assert.equal(respuesta.status, 400);
  assert.deepEqual((await respuesta.json()).error.detalles.campos, ["cedula"]);
});

test("los créditos son solo del cliente y vienen con su saldo en dólares", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);
  const creditos = (rol) => fetch(`${url}/me/creditos`, { headers: rol ? { "x-rol": rol } : {} });

  assert.equal((await creditos()).status, 401);
  assert.equal((await creditos("administrador")).status, 403);
  const respuesta = await creditos("cliente");
  assert.equal(respuesta.status, 200);
  assert.deepEqual((await respuesta.json()).datos, { saldo: 0, otorgado: 0, usado: 0, moneda: "USD", movimientos: [] });
});

test("GET /admin: solo el administrador busca clientes y recibe lo justo", async () => {
  const { url, cerrar } = await levantarServidor();
  try {
    const buscar = (headers) => fetch(`${url}/admin?q=cli`, { headers });

    assert.equal((await buscar({})).status, 401);
    assert.equal((await buscar({ "x-rol": "cliente" })).status, 403);

    const respuesta = await buscar({ "x-rol": "administrador" });
    assert.equal(respuesta.status, 200);
    assert.deepEqual((await respuesta.json()).datos, [
      { correo: "cliente@correo.test", nombre: "Cliente", cedula: "111111111" },
    ]);
  } finally {
    await cerrar();
  }
});

test("GET /admin: con menos de dos letras no busca", async () => {
  const { url, cerrar } = await levantarServidor();
  try {
    const respuesta = await fetch(`${url}/admin?q=c`, { headers: { "x-rol": "administrador" } });
    assert.deepEqual((await respuesta.json()).datos, []);
  } finally {
    await cerrar();
  }
});
