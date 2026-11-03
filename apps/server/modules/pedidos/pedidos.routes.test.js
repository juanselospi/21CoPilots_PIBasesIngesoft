import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { crearRutasDePedidos } from "./pedidos.routes.js";
import { PedidosController } from "./pedidos.controller.js";
import { PedidosService } from "./pedidos.service.js";
import { crearExigirRol } from "../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../shared/http/manejador-de-errores.js";

async function levantarServidor() {
  const repositorio = { listarTarifas: async () => [{ modalidad: "mensajero", monto: 3.5 }] };
  const aplicacion = express();
  aplicacion.use((peticion, _respuesta, siguiente) => {
    peticion.usuario = null;
    siguiente();
  });
  aplicacion.use(
    "/api/pedidos",
    crearRutasDePedidos(new PedidosController({ servicio: new PedidosService({ repositorio }) }), {
      exigirRol: crearExigirRol({ publicar: async () => {} }),
    })
  );
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  const url = `http://localhost:${servidor.address().port}/api/pedidos/modalidades`;
  return { url, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
}

test("las modalidades de entrega se consultan sin sesión, con su costo en dólares", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const respuesta = await fetch(url);
  const { datos } = await respuesta.json();

  assert.equal(respuesta.status, 200);
  assert.equal(datos.length, 4);
  assert.deepEqual(datos[0], { modalidad: "mensajero", nombre: "Mensajero", costo: 3.5, moneda: "USD", exigeDireccion: true });
  // Una modalidad sin fila en la tabla sale en 0
  assert.equal(datos.find((m) => m.modalidad === "entrega_personal").costo, 0);
});
