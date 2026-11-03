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
