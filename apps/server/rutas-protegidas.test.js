import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { crearRutasDeInventario } from "./modules/inventario/inventario.routes.js";
import { InventarioController } from "./modules/inventario/inventario.controller.js";
import { crearRutasDeReportes } from "./modules/reportes/reportes.routes.js";
import { crearRutasDePedidos } from "./modules/pedidos/pedidos.routes.js";
import { crearExigirRol, ROLES } from "./shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "./shared/http/manejador-de-errores.js";
import { rutaNoEncontrada } from "./shared/http/ruta-no-encontrada.js";

// Los módulos todavía no tienen rutas propias: lo que se prueba es que el
// candado de cada uno responda antes que el 404.
async function levantarServidor() {
  const aplicacion = express();
  aplicacion.use((peticion, _respuesta, siguiente) => {
    const rol = peticion.get("x-rol");
    peticion.usuario = rol ? { correo: "prueba@correo.test", rol } : null;
    siguiente();
  });

  const exigirRol = crearExigirRol({ publicar: async () => {} });
  aplicacion.use("/api/inventario", crearRutasDeInventario({}, { exigirRol }));
  aplicacion.use("/api/reportes", crearRutasDeReportes({}, { exigirRol }));
  aplicacion.use("/api/pedidos", crearRutasDePedidos({}, { exigirRol }));
  aplicacion.use(rutaNoEncontrada);
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  const base = `http://localhost:${servidor.address().port}`;
  return { base, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
}

async function estadoDe(url, rol) {
  const respuesta = await fetch(url, { headers: rol ? { "x-rol": rol } : {} });
  return respuesta.status;
}

for (const ruta of ["/api/inventario/alertas", "/api/reportes/ventas/por-producto"]) {
  test(`${ruta}: sin sesión responde 401 y un cliente recibe 403`, async (t) => {
    const { base, cerrar } = await levantarServidor();
    t.after(cerrar);

    assert.equal(await estadoDe(`${base}${ruta}`), 401);
    assert.equal(await estadoDe(`${base}${ruta}`, ROLES.CLIENTE), 403);
  });
}

test("el carrito: sin sesión responde 401 y el administrador recibe 403", async (t) => {
  const { base, cerrar } = await levantarServidor();
  t.after(cerrar);

  assert.equal(await estadoDe(`${base}/api/pedidos/carrito`), 401);
  assert.equal(await estadoDe(`${base}/api/pedidos/carrito`, ROLES.ADMINISTRADOR), 403);
});

test("con el rol correcto pasa el candado y llega a la ruta, que todavía no existe", async (t) => {
  const { base, cerrar } = await levantarServidor();
  t.after(cerrar);

  assert.equal(await estadoDe(`${base}/api/inventario/ruta-inexistente`, ROLES.ADMINISTRADOR), 404);
  assert.equal(await estadoDe(`${base}/api/pedidos/carrito`, ROLES.CLIENTE), 404);
});

test("las alertas de inventario responden al administrador con el umbral", async (t) => {
  const aplicacion = express();
  aplicacion.use((peticion, _respuesta, siguiente) => {
    peticion.usuario = { correo: "admin@dchobbies.test", rol: ROLES.ADMINISTRADOR };
    siguiente();
  });
  const controlador = new InventarioController({
    servicio: {
      listarAlertas: async () => ({
        umbral: 2,
        productos: [{ sku: "LEG-001", nombre: "Halcón", familia: "Legos", existencias: 2, admiteContrapedido: false }],
      }),
    },
  });
  aplicacion.use("/api/inventario", crearRutasDeInventario(controlador, { exigirRol: crearExigirRol({ publicar: async () => {} }) }));
  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  t.after(() => new Promise((resolver) => servidor.close(resolver)));

  const respuesta = await fetch(`http://localhost:${servidor.address().port}/api/inventario/alertas`);
  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 200);
  assert.deepEqual(cuerpo.meta, { umbral: 2, total: 1 });
  assert.deepEqual(cuerpo.datos[0], { sku: "LEG-001", nombre: "Halcón", familia: "Legos", existencias: 2, admiteContrapedido: false });
});

test("registrar un ingreso responde 201 con el movimiento y exige administrador", async (t) => {
  const aplicacion = express();
  aplicacion.use(express.json());
  aplicacion.use((peticion, _respuesta, siguiente) => {
    const rol = peticion.get("x-rol");
    peticion.usuario = rol ? { correo: "admin@dchobbies.test", rol } : null;
    siguiente();
  });
  const ingresos = [];
  const controlador = new InventarioController({
    servicio: {
      registrarIngreso: async (datos, { responsable }) => {
        ingresos.push(responsable);
        return {
          sku: datos.sku,
          tipo: "ingreso",
          cantidad: datos.cantidad,
          costoUnitario: 120,
          motivo: null,
          fecha: "2026-11-03T18:00:00.000Z",
          existenciasResultantes: 13,
        };
      },
    },
  });
  aplicacion.use(
    "/api/inventario",
    crearRutasDeInventario(controlador, { exigirRol: crearExigirRol({ publicar: async () => {} }) })
  );
  aplicacion.use(manejadorDeErrores);
  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  t.after(() => new Promise((resolver) => servidor.close(resolver)));
  const ingresar = (rol) =>
    fetch(`http://localhost:${servidor.address().port}/api/inventario/ingresos`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(rol ? { "x-rol": rol } : {}) },
      body: JSON.stringify({ sku: "LEG-001", cantidad: 10, costoUnitario: 120 }),
    });

  assert.equal((await ingresar()).status, 401);
  assert.equal((await ingresar(ROLES.CLIENTE)).status, 403);
  const respuesta = await ingresar(ROLES.ADMINISTRADOR);
  const { datos } = await respuesta.json();

  assert.equal(respuesta.status, 201);
  assert.equal(datos.existencias, 13);
  assert.deepEqual(ingresos, ["admin@dchobbies.test"]);
});

test("un ajuste sin motivo responde 400 y el historial se consulta con su total", async (t) => {
  const { InventarioService } = await import("./modules/inventario/inventario.service.js");
  const aplicacion = express();
  aplicacion.use(express.json());
  aplicacion.use((peticion, _respuesta, siguiente) => {
    peticion.usuario = { correo: "admin@dchobbies.test", rol: ROLES.ADMINISTRADOR };
    siguiente();
  });
  const repositorio = {
    listarMovimientos: async () => ({
      movimientos: [
        {
          sku: "LEG-001",
          nombre: "Halcón",
          fecha: "2026-11-03T18:00:00.000Z",
          cantidad: 10,
          tipo: "ingreso",
          costoUnitario: 120,
          motivo: null,
          responsable: "admin@dchobbies.test",
        },
      ],
      total: 1,
    }),
  };
  const controlador = new InventarioController({ servicio: new InventarioService({ repositorio }) });
  aplicacion.use(
    "/api/inventario",
    crearRutasDeInventario(controlador, { exigirRol: crearExigirRol({ publicar: async () => {} }) })
  );
  aplicacion.use(manejadorDeErrores);
  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  t.after(() => new Promise((resolver) => servidor.close(resolver)));
  const base = `http://localhost:${servidor.address().port}/api/inventario`;

  const ajuste = await fetch(`${base}/ajustes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sku: "LEG-001", cantidad: -1 }),
  });
  assert.equal(ajuste.status, 400);
  assert.deepEqual((await ajuste.json()).error.detalles.campos, ["motivo"]);

  const historial = await (await fetch(`${base}/movimientos?sku=LEG-001`)).json();
  assert.deepEqual(historial.meta, { total: 1, pagina: 0, limite: 50 });
  assert.equal(historial.datos[0].tipo, "ingreso");
});
