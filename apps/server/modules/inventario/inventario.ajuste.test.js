import test from "node:test";
import assert from "node:assert/strict";

import { InventarioService } from "./inventario.service.js";
import { validarAjuste } from "./validar-ajuste.js";
import { validarConsultaDeMovimientos } from "./validar-consulta-de-movimientos.js";
import {
  EntradaInvalida,
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
} from "../../shared/errores/errores-de-dominio.js";

// Base falsa: LEG-001 tiene 3 unidades.
function crearServicio() {
  const stock = new Map([["LEG-001", 3]]);
  const movimientos = [];
  const eventos = [];
  const repositorio = {
    enTransaccion: async (trabajo) => trabajo({}),
    bloquearProductos: async (_cliente, skus) =>
      new Map(skus.filter((sku) => stock.has(sku)).map((sku) => [sku, { sku, stock: stock.get(sku) }])),
    registrarMovimiento: async (_cliente, movimiento) => {
      stock.set(movimiento.sku, stock.get(movimiento.sku) + movimiento.cantidad);
      const registrado = { ...movimiento, fecha: new Date(), existenciasResultantes: stock.get(movimiento.sku) };
      movimientos.push(registrado);
      return registrado;
    },
  };
  const busDeEventos = { publicar: async (evento, datos) => eventos.push({ evento, datos }) };
  return { servicio: new InventarioService({ repositorio, busDeEventos }), stock, movimientos, eventos };
}

const admin = { responsable: "admin@dchobbies.test" };

test("RF-20: un ajuste resta unidades y deja el motivo y quién lo hizo", async () => {
  const { servicio, stock, movimientos } = crearServicio();

  await servicio.registrarAjuste({ sku: "LEG-001", cantidad: -2, motivo: "Caja dañada" }, admin);

  assert.equal(stock.get("LEG-001"), 1);
  assert.equal(movimientos[0].tipo, "ajuste");
  assert.equal(movimientos[0].motivo, "Caja dañada");
  assert.equal(movimientos[0].correoAdministrador, "admin@dchobbies.test");
});

test("un ajuste no puede dejar el stock en negativo", async () => {
  const { servicio, stock, movimientos } = crearServicio();

  await assert.rejects(servicio.registrarAjuste({ sku: "LEG-001", cantidad: -5, motivo: "Robo" }, admin), (error) => {
    assert.ok(error instanceof ReglaDeNegocioViolada);
    assert.match(error.message, /Solo hay 3 unidades/);
    return true;
  });
  assert.equal(stock.get("LEG-001"), 3);
  assert.equal(movimientos.length, 0);
});

test("corregir las existencias desde el panel deja la diferencia como ajuste con su motivo", async () => {
  const { servicio, stock, movimientos, eventos } = crearServicio();

  await servicio.fijarExistencias("LEG-001", 10, admin);

  assert.equal(stock.get("LEG-001"), 10);
  assert.equal(movimientos[0].cantidad, 7);
  assert.equal(movimientos[0].motivo, "Corrección desde el panel");
  assert.equal(eventos[0].evento, "movimiento_registrado");
});

test("fijar las mismas existencias que ya tiene no deja movimiento", async () => {
  const { servicio, movimientos, eventos } = crearServicio();

  assert.equal(await servicio.fijarExistencias("LEG-001", 3, admin), null);
  assert.equal(movimientos.length, 0);
  assert.deepEqual(eventos, []);
});

test("ajustar un producto que no existe responde no encontrado", async () => {
  const { servicio } = crearServicio();

  await assert.rejects(servicio.registrarAjuste({ sku: "NO-EXISTE", cantidad: 1, motivo: "x" }, admin), RecursoNoEncontrado);
});

function camposConProblemas(validar, datos) {
  try {
    validar(datos);
    return [];
  } catch (error) {
    assert.ok(error instanceof EntradaInvalida);
    return error.detalles.campos;
  }
}

test("RF-20: un ajuste sin motivo responde con el campo", () => {
  assert.deepEqual(camposConProblemas(validarAjuste, { sku: "LEG-001", cantidad: 1, motivo: "  " }), ["motivo"]);
});

test("un ajuste de 0 unidades o con decimales se rechaza", () => {
  for (const cantidad of [0, "1.5", "x"]) {
    assert.deepEqual(camposConProblemas(validarAjuste, { sku: "LEG-001", cantidad, motivo: "Conteo" }), ["cantidad"]);
  }
});

test("el historial filtra por producto y fechas, con 'hasta' incluyendo ese día", () => {
  const filtros = validarConsultaDeMovimientos({ sku: "leg-001", desde: "2026-11-01", hasta: "2026-11-01" });

  assert.equal(filtros.sku, "LEG-001");
  assert.equal(filtros.hasta - filtros.desde, 24 * 60 * 60 * 1000);
  assert.deepEqual(camposConProblemas(validarConsultaDeMovimientos, { desde: "ayer", limite: "7" }), ["desde", "limite"]);
});
