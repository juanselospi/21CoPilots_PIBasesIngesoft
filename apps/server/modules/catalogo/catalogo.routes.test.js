import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { crearRutasDeCatalogo } from "./catalogo.routes.js";
import { CatalogoController } from "./catalogo.controller.js";
import { crearExigirRol, ROLES } from "../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../shared/http/manejador-de-errores.js";
import { EntradaInvalida, ReglaDeNegocioViolada } from "../../shared/errores/errores-de-dominio.js";

// Servicio falso: PKM-001 ya existe, un código vacío es inválido y el
// resto se registra.
const servicio = {
  listarCatalogo: async () => [],
  crearProducto: async ({ sku }) => {
    if (!sku) throw new EntradaInvalida("El código es obligatorio.", ["sku"]);
    if (sku === "PKM-001") throw new ReglaDeNegocioViolada("Ya existe un producto con el código PKM-001.", "RF-01");
    return { sku, nombre: "Nuevo", categoria: "Trading Cards", precioFinal: 169.5, costoItem: 100, existencias: 0 };
  },
};

// La cabecera x-rol simula la sesión; sin ella no hay usuario.
async function levantarServidor() {
  const aplicacion = express();
  aplicacion.use(express.json());
  aplicacion.use((peticion, _respuesta, siguiente) => {
    const rol = peticion.get("x-rol");
    peticion.usuario = rol ? { correo: "prueba@correo.test", rol } : null;
    siguiente();
  });
  aplicacion.use(
    "/api/catalogo",
    crearRutasDeCatalogo(new CatalogoController({ servicio }), {
      exigirRol: crearExigirRol({ publicar: async () => {} }),
    })
  );
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  const url = `http://localhost:${servidor.address().port}/api/catalogo/productos`;
  return { url, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
}

async function registrar(url, producto, rol) {
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(rol ? { "x-rol": rol } : {}) },
    body: JSON.stringify(producto),
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}

test("registrar un producto exige sesión de administrador", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  assert.equal((await registrar(url, { sku: "NUEVO-1" })).estado, 401);
  assert.equal((await registrar(url, { sku: "NUEVO-1" }, ROLES.CLIENTE)).estado, 403);
});

test("el administrador registra un producto y recibe 201 con su precio", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await registrar(url, { sku: "NUEVO-1" }, ROLES.ADMINISTRADOR);

  assert.equal(estado, 201);
  assert.equal(cuerpo.datos.sku, "NUEVO-1");
  assert.equal(cuerpo.datos.precioFinal, 169.5);
  assert.equal(cuerpo.datos.costoItem, 100);
});

test("un código repetido responde 409 con un mensaje claro", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await registrar(url, { sku: "PKM-001" }, ROLES.ADMINISTRADOR);

  assert.equal(estado, 409);
  assert.equal(cuerpo.error.mensaje, "Ya existe un producto con el código PKM-001.");
});

test("datos inválidos responden 400 con los campos a corregir", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await registrar(url, { sku: "" }, ROLES.ADMINISTRADOR);

  assert.equal(estado, 400);
  assert.deepEqual(cuerpo.error.detalles.campos, ["sku"]);
});

test("las consultas del catálogo siguen siendo públicas", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  assert.equal((await fetch(url)).status, 200);
});
