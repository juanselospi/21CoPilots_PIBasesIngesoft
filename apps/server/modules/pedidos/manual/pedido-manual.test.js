import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { CORREO_DE_VENTA_SIN_CUENTA, validarPedidoManual } from "./validar-pedido-manual.js";
import { PedidosService } from "../pedidos.service.js";
import { PedidosController } from "../pedidos.controller.js";
import { crearRutasDePedidos } from "../pedidos.routes.js";
import { crearExigirRol, ROLES } from "../../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../../shared/http/manejador-de-errores.js";
import { EntradaInvalida, RecursoNoEncontrado, SinExistencias } from "../../../shared/errores/errores-de-dominio.js";
import { EVENTOS } from "../../../shared/eventos/eventos-de-dominio.js";

const ADMIN = "admin@dchobbies.test";
const ANA = "ana@correo.test";
const VENTA = Object.freeze({
  correoCliente: "Ana@Correo.test",
  canal: "whatsapp",
  modalidadEntrega: "mensajero",
  direccion: "Heredia",
  metodoPago: "sinpe_movil",
  lineas: [
    { sku: "leg-001", cantidad: 2 },
    { sku: "BOO-001", cantidad: 4 },
  ],
});

const camposConProblemas = (datos) => {
  try {
    validarPedidoManual(datos);
    return [];
  } catch (error) {
    assert.ok(error instanceof EntradaInvalida);
    return [...new Set(error.detalles.campos)];
  }
};

test("la venta se normaliza: correo en minúsculas y SKU en mayúsculas", () => {
  const venta = validarPedidoManual(VENTA);

  assert.equal(venta.correo, ANA);
  assert.equal(venta.sinCuenta, false);
  assert.deepEqual(venta.lineas, [
    { sku: "LEG-001", cantidad: 2 },
    { sku: "BOO-001", cantidad: 4 },
  ]);
});

test("alguien sin cuenta va a la cuenta de ventas sin cuenta con su nombre como destinatario", () => {
  const { correoCliente: _correo, ...sinCorreo } = VENTA;
  const venta = validarPedidoManual({ ...sinCorreo, canal: "presencial", clienteNuevo: { nombre: " María Pérez " } });

  assert.equal(venta.correo, CORREO_DE_VENTA_SIN_CUENTA);
  assert.equal(venta.sinCuenta, true);
  assert.equal(venta.nombreDestinatario, "María Pérez");
});

test("revisa todo a la vez: canal web, pago con tarjeta, sin cliente y productos repetidos", () => {
  const { correoCliente: _correo, ...sinCorreo } = VENTA;

  assert.deepEqual(
    camposConProblemas({
      ...sinCorreo,
      canal: "web",
      metodoPago: "tarjeta",
      lineas: [
        { sku: "LEG-001", cantidad: 1 },
        { sku: "leg-001", cantidad: 2 },
      ],
    }),
    ["canal", "metodoPago", "correoCliente", "lineas"]
  );
  assert.deepEqual(camposConProblemas({ ...VENTA, clienteNuevo: { nombre: "Otra" } }), ["correoCliente", "clienteNuevo"]);
  assert.deepEqual(camposConProblemas({ ...VENTA, lineas: [] }), ["lineas"]);
  assert.deepEqual(camposConProblemas({ ...VENTA, lineas: [{ sku: "LEG-001", cantidad: 0 }] }), ["lineas"]);
});

// Escenario: hay 3 LEG-001 (sin contrapedido) y 1 BOO-001 (con contrapedido).
// La "base" solo guarda los cambios si la transacción termina bien.
function crearEscenario({ stock } = {}) {
  const estado = {
    stock: stock ?? { "LEG-001": 3, "BOO-001": 1 },
    lineas: [],
    movimientos: [],
    pedidos: [],
    pagos: [],
    facturas: [],
    compras: 0,
  };
  const eventos = [];
  const catalogo = {
    "LEG-001": { sku: "LEG-001", nombre: "Halcón", precioSinImpuesto: 100, tasaImpuesto: 13, precioFinal: 113, admiteContrapedido: false, aLaVenta: true },
    "BOO-001": { sku: "BOO-001", nombre: "Booster", precioSinImpuesto: 10, tasaImpuesto: 13, precioFinal: 11.3, admiteContrapedido: true, aLaVenta: true },
  };

  const repositorio = {
    listarTarifas: async () => [
      { modalidad: "mensajero", monto: 3.5 },
      { modalidad: "entrega_personal", monto: 0 },
    ],
    enTransaccion: async (trabajo) => {
      const copia = structuredClone(estado);
      try {
        return await trabajo({});
      } catch (error) {
        Object.assign(estado, copia);
        throw error;
      }
    },
    abrirCarritoConvertido: async () => 4,
    guardarLinea: async (_correo, _num, linea) => estado.lineas.push(linea),
    crearPedido: async (_c, pedido) => estado.pedidos.push(pedido),
    obtenerParaAdministracion: async () => ({ estado: "colocado", subtotal: 0, impuesto: 0, costoEntrega: 0 }),
    lineasDelPedido: async () => [],
    historialDeEstados: async () => [{ estado: "colocado" }],
  };
  const servicio = new PedidosService({
    repositorio,
    inventario: {
      bloquearEnTransaccion: async (_c, skus) => new Map(skus.map((sku) => [sku, { sku, stock: estado.stock[sku] }])),
      registrarEnTransaccion: async (_c, movimiento) => {
        estado.stock[movimiento.sku] += movimiento.cantidad;
        estado.movimientos.push(movimiento);
        return movimiento;
      },
      publicarMovimientos: async (movimientos) => movimientos.forEach((m) => eventos.push(["movimiento", m.sku])),
    },
    clientes: {
      datosDeContacto: async (correo) => ([ANA, CORREO_DE_VENTA_SIN_CUENTA].includes(correo) ? { telefonos: [] } : null),
      sumarCompra: async () => (estado.compras += 1),
      datosParaFactura: async () => ({ nombre: "Ana Mora", cedula: "123456789" }),
      creditoOtorgadoPorPedido: async () => 0,
    },
    pagos: {
      registrar: async (_c, pago) => (estado.pagos.push(pago), pago),
      listarPorPedido: async () => [],
    },
    facturas: {
      obtenerEmisor: async () => ({ razonSocial: "DC Hobbies" }),
      registrar: async (_c, factura) => (estado.facturas.push(factura), factura),
      buscarPorPedido: async () => null,
    },
    facturacionElectronica: { emitir: async ({ numReferencia }) => ({ estado: "emitida", consecutivo: `FAC-${numReferencia}` }) },
    productosParaVenta: async (skus) => new Map(skus.filter((sku) => catalogo[sku]).map((sku) => [sku, catalogo[sku]])),
    busDeEventos: { publicar: async (evento, datos) => eventos.push([evento, datos]) },
  });
  return { servicio, estado, eventos };
}

test("HU-09: una venta por WhatsApp de dos productos es un solo pedido que descuenta el inventario", async () => {
  const { servicio, estado, eventos } = crearEscenario();

  await servicio.registrarPedidoManual(VENTA, { responsable: ADMIN });

  assert.equal(estado.pedidos.length, 1);
  const [pedido] = estado.pedidos;
  assert.deepEqual(
    [pedido.correo, pedido.numCarrito, pedido.canal, pedido.creadoPor, pedido.costoEntrega],
    [ANA, 4, "whatsapp", ADMIN, 3.5]
  );
  // Del booster solo había 1; el resto queda en contrapedido
  assert.deepEqual(estado.movimientos.map((m) => [m.sku, m.cantidad, m.tipo, m.correoAdministrador, m.motivo]), [
    ["LEG-001", -2, "venta_externa", ADMIN, `Pedido ${ANA}/4`],
    ["BOO-001", -1, "venta_externa", ADMIN, `Pedido ${ANA}/4`],
  ]);
  // 2 × 113 + 4 × 11,30 + 3,50 de envío, cobrado en el momento
  assert.deepEqual(estado.pagos.map((p) => [p.metodoPago, p.monto, p.estadoPago]), [["sinpe_movil", 274.7, "aprobado"]]);
  assert.equal(estado.facturas.length, 1);
  assert.equal(estado.compras, 1);

  const [, creado] = eventos.find(([nombre]) => nombre === EVENTOS.PEDIDO_CREADO_MANUAL);
  assert.equal(creado.correoUsuario, ADMIN);
  assert.equal(creado.entidadId, `${ANA}/4`);
  assert.equal(creado.valorNuevo.canal, "whatsapp");
});

test("una venta presencial a alguien sin cuenta queda a nombre de la persona", async () => {
  const { servicio, estado } = crearEscenario();
  const { correoCliente: _correo, ...sinCorreo } = VENTA;

  await servicio.registrarPedidoManual(
    { ...sinCorreo, canal: "presencial", modalidadEntrega: "entrega_personal", metodoPago: "efectivo", clienteNuevo: { nombre: "María Pérez" } },
    { responsable: ADMIN }
  );

  assert.equal(estado.pedidos[0].correo, CORREO_DE_VENTA_SIN_CUENTA);
  assert.equal(estado.pedidos[0].nombreDestinatario, "María Pérez");
});

test("si un producto no alcanza no se crea nada", async () => {
  const { servicio, estado, eventos } = crearEscenario({ stock: { "LEG-001": 1, "BOO-001": 1 } });

  await assert.rejects(
    servicio.registrarPedidoManual(VENTA, { responsable: ADMIN }),
    (error) => error instanceof SinExistencias && /LEG-001 \(hay 1\)/.test(error.message)
  );
  assert.deepEqual([estado.pedidos, estado.movimientos, estado.pagos], [[], [], []]);
  assert.deepEqual(estado.stock, { "LEG-001": 1, "BOO-001": 1 });
  assert.equal(eventos.length, 0);
});

test("un cliente o un producto que no existe responde que no se encontró", async () => {
  const { servicio } = crearEscenario();

  await assert.rejects(
    servicio.registrarPedidoManual({ ...VENTA, correoCliente: "nadie@correo.test" }, { responsable: ADMIN }),
    RecursoNoEncontrado
  );
  await assert.rejects(
    servicio.registrarPedidoManual({ ...VENTA, lineas: [{ sku: "XYZ-999", cantidad: 1 }] }, { responsable: ADMIN }),
    RecursoNoEncontrado
  );
});

test("registrar un pedido manual es solo del administrador y responde 201", async (t) => {
  const { servicio } = crearEscenario();
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
  t.after(() => new Promise((resolver) => servidor.close(resolver)));
  const enviar = (rol, cuerpo) =>
    fetch(`http://localhost:${servidor.address().port}/api/pedidos/admin`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(rol ? { "x-rol": rol } : {}) },
      body: JSON.stringify(cuerpo),
    });

  assert.equal((await enviar(null, VENTA)).status, 401);
  assert.equal((await enviar(ROLES.CLIENTE, VENTA)).status, 403);
  assert.equal((await enviar(ROLES.ADMINISTRADOR, { ...VENTA, canal: "web" })).status, 400);
  assert.equal((await enviar(ROLES.ADMINISTRADOR, VENTA)).status, 201);
});
