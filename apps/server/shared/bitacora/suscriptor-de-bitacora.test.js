import test from "node:test";
import assert from "node:assert/strict";

import { registrarSuscriptorDeBitacora, aRegistro, EVENTOS_DE_LA_BITACORA } from "./suscriptor-de-bitacora.js";
import { BusDeEventos } from "../eventos/bus-de-eventos.js";
import { EVENTOS } from "../eventos/eventos-de-dominio.js";

function crearBus() {
  const bus = new BusDeEventos();
  const guardados = [];
  registrarSuscriptorDeBitacora(bus, { guardar: async (registro) => guardados.push(registro) });
  return { bus, guardados };
}

test("RF-52: un cambio de margen se guarda con usuario, entidad, valor anterior y nuevo", async () => {
  const { bus, guardados } = crearBus();

  await bus.publicar(EVENTOS.PARAMETRO_MODIFICADO, {
    correoUsuario: "admin@dchobbies.test",
    entidad: "familia",
    entidadId: "Legos",
    valorAnterior: { margenGanancia: 18 },
    valorNuevo: { margenGanancia: 25 },
  });

  assert.deepEqual(guardados, [
    {
      correoUsuario: "admin@dchobbies.test",
      evento: "parametro_modificado",
      entidad: "familia",
      entidadId: "Legos",
      valorAnterior: { margenGanancia: 18 },
      valorNuevo: { margenGanancia: 25 },
    },
  ]);
});

test("escucha los cambios de pedidos, los nuevos incluidos", () => {
  for (const evento of [EVENTOS.PEDIDO_MODIFICADO, EVENTOS.PEDIDO_CREADO_MANUAL, EVENTOS.ESTADO_DE_PEDIDO_CAMBIADO]) {
    assert.ok(EVENTOS_DE_LA_BITACORA.includes(evento), evento);
  }
});

test("un evento sin usuario no se guarda, porque la tabla exige quién lo hizo", async () => {
  const { bus, guardados } = crearBus();

  await bus.publicar(EVENTOS.ACCESO_DENEGADO, { correoUsuario: null, entidad: "ruta", entidadId: "GET /api/x" });

  assert.deepEqual(guardados, []);
});

test("la alerta de existencias se guarda sobre el producto con lo que trae como valor nuevo", () => {
  const registro = aRegistro(EVENTOS.EXISTENCIAS_BAJAS, {
    correoUsuario: "cliente@correo.test",
    sku: "LEG-001",
    existencias: 2,
    umbral: 2,
  });

  assert.deepEqual(registro, {
    correoUsuario: "cliente@correo.test",
    evento: "existencias_bajas",
    entidad: "producto",
    entidadId: "LEG-001",
    valorAnterior: null,
    valorNuevo: { sku: "LEG-001", existencias: 2, umbral: 2 },
  });
});

test("un evento que no es de auditoría no se guarda", async () => {
  const bus = new BusDeEventos();
  const guardados = [];
  registrarSuscriptorDeBitacora(bus, { guardar: async (registro) => guardados.push(registro) });

  await bus.publicar("otro_evento", { correoUsuario: "admin@dchobbies.test" });

  assert.deepEqual(guardados, []);
});
