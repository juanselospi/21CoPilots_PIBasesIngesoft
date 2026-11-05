import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { PedidosService } from "../pedidos.service.js";
import { PedidosController } from "../pedidos.controller.js";
import { crearRutasDePedidos } from "../pedidos.routes.js";
import { crearExigirRol, ROLES } from "../../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../../shared/http/manejador-de-errores.js";
import { RecursoNoEncontrado, ReglaDeNegocioViolada } from "../../../shared/errores/errores-de-dominio.js";
import { EVENTOS } from "../../../shared/eventos/eventos-de-dominio.js";

const ANA = "ana@correo.test";
const ADMIN = "admin@dchobbies.test";
const MOTIVO = `Pedido ${ANA}/7`;

// Escenario: el pedido 7 de Ana pidió 2 LEG-001 y 4 BOO-001, pero de
// BOO-001 solo salió 1 (el resto quedó en contrapedido). La "base" solo
// guarda los cambios si la transacción termina bien.
function crearEscenario({ historial = ["colocado"] } = {}) {
  const estado = {
    historial: historial.map((e, i) => ({ estado: e, fecha: new Date(Date.UTC(2026, 10, 3, i)) })),
    stock: { "LEG-001": 1, "BOO-001": 0 },
    movimientos: [
      { sku: "BOO-001", cantidad: -1, motivo: MOTIVO },
      { sku: "LEG-001", cantidad: -2, motivo: MOTIVO },
      { sku: "LEG-001", cantidad: -5, motivo: "Pedido otra@correo.test/1" },
    ],
  };
  const eventos = [];

  const repositorio = {
    enTransaccion: async (trabajo) => {
      const copia = structuredClone(estado);
      try {
        return await trabajo({});
      } catch (error) {
        Object.assign(estado, copia);
        throw error;
      }
    },
    bloquearPedido: async (_c, correo, numCarrito) => correo === ANA && numCarrito === 7,
    historialDeEstados: async () => structuredClone(estado.historial),
    registrarEstado: async (_c, _correo, _num, nuevo) => {
      estado.historial.push({ estado: nuevo, fecha: new Date() });
    },
    obtenerParaAdministracion: async () => ({ estado: estado.historial.at(-1).estado, subtotal: 0, impuesto: 0, costoEntrega: 0 }),
    lineasDelPedido: async () => [],
  };
  const inventario = {
    unidadesQueSalieronEnTransaccion: async (_c, motivo) => {
      const netas = new Map();
      for (const m of estado.movimientos.filter((m) => m.motivo === motivo)) {
        netas.set(m.sku, (netas.get(m.sku) ?? 0) - m.cantidad);
      }
      return new Map([...netas].filter(([, unidades]) => unidades > 0));
    },
    bloquearEnTransaccion: async () => new Map(),
    registrarEnTransaccion: async (_c, movimiento) => {
      estado.stock[movimiento.sku] += movimiento.cantidad;
      estado.movimientos.push(movimiento);
      return { ...movimiento, existenciasResultantes: estado.stock[movimiento.sku] };
    },
    publicarMovimientos: async (movimientos) => movimientos.forEach((m) => eventos.push(["movimiento", m.sku])),
  };
  const servicio = new PedidosService({
    repositorio,
    inventario,
    busDeEventos: { publicar: async (evento, datos) => eventos.push([evento, datos]) },
    clientes: { datosDeContacto: async () => null },
    pagos: { listarPorPedido: async () => [] },
    facturas: { buscarPorPedido: async () => null },
    productosParaVenta: async () => new Map(),
  });
  return { servicio, estado, eventos };
}

const cambiar = (servicio, estadoNuevo, correo = ANA, numCarrito = 7) =>
  servicio.cambiarEstado(correo, numCarrito, { estado: estadoNuevo }, { responsable: ADMIN });

test("el administrador avanza el pedido y queda en el historial con quién lo hizo", async () => {
  const { servicio, estado, eventos } = crearEscenario();

  const pedido = await cambiar(servicio, "procesado");

  assert.deepEqual(estado.historial.map((h) => h.estado), ["colocado", "procesado"]);
  assert.equal(pedido.estado, "procesado");
  assert.deepEqual(pedido.estadosSiguientes, ["en_transito", "cancelado", "en_disputa"]);
  const [evento, datos] = eventos.find(([nombre]) => nombre === EVENTOS.ESTADO_DE_PEDIDO_CAMBIADO);
  assert.equal(evento, EVENTOS.ESTADO_DE_PEDIDO_CAMBIADO);
  assert.deepEqual(datos, {
    correoUsuario: ADMIN,
    entidad: "pedido",
    entidadId: `${ANA}/7`,
    valorAnterior: { estado: "colocado" },
    valorNuevo: { estado: "procesado" },
  });
});

test("RF-28: cancelar devuelve lo que salió del inventario y no lo que quedó en contrapedido", async () => {
  const { servicio, estado, eventos } = crearEscenario({ historial: ["colocado", "procesado"] });

  await cambiar(servicio, "cancelado");

  assert.deepEqual(estado.stock, { "LEG-001": 3, "BOO-001": 1 });
  assert.deepEqual(
    estado.movimientos.slice(3).map((m) => [m.sku, m.cantidad, m.tipo, m.correoAdministrador, m.motivo]),
    [
      ["BOO-001", 1, "reposicion", ADMIN, MOTIVO],
      ["LEG-001", 2, "reposicion", ADMIN, MOTIVO],
    ]
  );
  const cancelado = eventos.find(([nombre]) => nombre === EVENTOS.PEDIDO_CANCELADO)[1];
  assert.deepEqual(cancelado.valorNuevo, {
    estado: "cancelado",
    unidadesRepuestas: [
      { sku: "BOO-001", cantidad: 1 },
      { sku: "LEG-001", cantidad: 2 },
    ],
  });
});

test("RN-15: un pedido en tránsito ya no se cancela y nada cambia", async () => {
  const { servicio, estado, eventos } = crearEscenario({ historial: ["colocado", "procesado", "en_transito"] });

  await assert.rejects(cambiar(servicio, "cancelado"), ReglaDeNegocioViolada);

  assert.equal(estado.historial.length, 3);
  assert.deepEqual(estado.stock, { "LEG-001": 1, "BOO-001": 0 });
  assert.equal(eventos.length, 0);
});

test("una disputa vuelve al estado en que estaba el pedido", async () => {
  const { servicio, estado } = crearEscenario({ historial: ["colocado", "procesado", "en_transito"] });

  const enDisputa = await cambiar(servicio, "en_disputa");
  assert.deepEqual(enDisputa.estadosSiguientes, ["en_transito"]);
  await assert.rejects(cambiar(servicio, "finalizado"), ReglaDeNegocioViolada);
  await cambiar(servicio, "en_transito");

  assert.deepEqual(estado.historial.map((h) => h.estado), ["colocado", "procesado", "en_transito", "en_disputa", "en_transito"]);
});

test("cambiar el estado de un pedido que no existe responde que no se encontró", async () => {
  const { servicio } = crearEscenario();

  await assert.rejects(cambiar(servicio, "procesado", ANA, 99), RecursoNoEncontrado);
});

async function levantarServidor(servicio) {
  const aplicacion = express();
  aplicacion.use(express.json());
  aplicacion.use((peticion, _respuesta, siguiente) => {
    const rol = peticion.get("x-rol");
    peticion.usuario = rol ? { correo: rol === ROLES.ADMINISTRADOR ? ADMIN : ANA, rol } : null;
    siguiente();
  });
  aplicacion.use(
    "/api/pedidos",
    crearRutasDePedidos(new PedidosController({ servicio }), { exigirRol: crearExigirRol({ publicar: async () => {} }) })
  );
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  const url = `http://localhost:${servidor.address().port}/api/pedidos/admin/ana%40correo.test/7/estado`;
  return { url, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
}

test("solo el administrador cambia el estado: el cliente no puede cancelar su pedido", async (t) => {
  const { servicio, estado } = crearEscenario();
  const { url, cerrar } = await levantarServidor(servicio);
  t.after(cerrar);
  const enviar = (rol, cuerpo) =>
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...(rol ? { "x-rol": rol } : {}) },
      body: JSON.stringify(cuerpo),
    });

  assert.equal((await enviar(null, { estado: "cancelado" })).status, 401);
  assert.equal((await enviar(ROLES.CLIENTE, { estado: "cancelado" })).status, 403);
  assert.equal((await enviar(ROLES.ADMINISTRADOR, { estado: "perdido" })).status, 400);
  assert.equal(estado.historial.length, 1);

  const respuesta = await enviar(ROLES.ADMINISTRADOR, { estado: "Cancelado" });
  const { datos } = await respuesta.json();
  assert.equal(respuesta.status, 200);
  assert.equal(datos.estado, "cancelado");
  assert.deepEqual(datos.estadosSiguientes, []);

  // Un pedido cancelado ya no cambia
  assert.equal((await enviar(ROLES.ADMINISTRADOR, { estado: "procesado" })).status, 409);
});
