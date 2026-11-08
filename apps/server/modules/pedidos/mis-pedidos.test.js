import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { PedidosService } from "./pedidos.service.js";
import { PedidosController } from "./pedidos.controller.js";
import { crearRutasDePedidos } from "./pedidos.routes.js";
import { crearExigirRol, ROLES } from "../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../shared/http/manejador-de-errores.js";

const ANA = "ana@correo.test";

const PEDIDO = Object.freeze({
  correoCliente: ANA,
  nombreCliente: "Ana Mora",
  cedula: "1-1111-1111",
  numCarrito: 2,
  fecha: "2026-11-03T18:00:00.000Z",
  estado: "en_transito",
  canal: "whatsapp",
  creadoPor: "empleado@dchobbies.test",
  nombreDestinatario: "Luis",
  modalidadEntrega: "mensajero",
  subtotal: 100,
  impuesto: 13.000000001,
  costoEntrega: 3.5,
  productos: [{ sku: "LEG-001", nombre: "Halcón", cantidad: 2 }],
  unidades: 2,
  estadoPago: "aprobado",
});

function crearServicio() {
  const consultas = [];
  const servicio = new PedidosService({
    repositorio: {
      listarParaAdministracion: async (filtros) => {
        consultas.push(filtros);
        return { pedidos: [PEDIDO], total: 1 };
      },
      obtenerParaAdministracion: async (correo, numCarrito) => {
        consultas.push({ correo, numCarrito });
        if (correo !== ANA || numCarrito !== 2) return null;
        return { ...PEDIDO, direccion: "San Pedro", fechaEntrega: null, nombreCreadoPor: "Empleado" };
      },
      lineasDelPedido: async () => [{ sku: "LEG-001", cantidad: 2, precioUnitario: 50, tasaImpuesto: 13 }],
      historialDeEstados: async () => [{ estado: "en_transito", fecha: "2026-11-03T18:00:00.000Z" }],
    },
    clientes: {
      datosDeContacto: async () => ({ telefonos: ["8888-8888"] }),
      creditoOtorgadoPorPedido: async () => 5,
    },
    pagos: {
      listarPorPedido: async () => [
        { numReferencia: "SIM-1", fecha: "2026-11-03T18:00:00.000Z", monto: 116.5, metodoPago: "tarjeta", estadoPago: "aprobado" },
      ],
    },
    facturas: { buscarPorPedido: async () => ({ numFactura: "F-1", fecha: "2026-11-03T18:00:00.000Z", numReferencia: "SIM-1" }) },
    productosParaVenta: async () => new Map([["LEG-001", { nombre: "Halcón" }]]),
  });
  return { servicio, consultas };
}

async function levantarServidor(t) {
  const { servicio, consultas } = crearServicio();
  const aplicacion = express();
  aplicacion.use((peticion, _respuesta, siguiente) => {
    const rol = peticion.get("x-rol");
    peticion.usuario = rol ? { correo: peticion.get("x-correo") ?? ANA, rol } : null;
    siguiente();
  });
  aplicacion.use(
    "/api/pedidos",
    crearRutasDePedidos(new PedidosController({ servicio }), {
      exigirRol: crearExigirRol({ publicar: async () => {} }),
    })
  );
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  t.after(() => new Promise((resolver) => servidor.close(resolver)));

  const pedir = async (ruta, cabeceras = {}) => {
    const respuesta = await fetch(`http://localhost:${servidor.address().port}/api/pedidos${ruta}`, { headers: cabeceras });
    return { estado: respuesta.status, cuerpo: await respuesta.json() };
  };
  return { pedir, consultas };
}

const CLIENTE = { "x-rol": ROLES.CLIENTE };
const ADMINISTRADOR = { "x-rol": ROLES.ADMINISTRADOR };

test("la lista filtra por el correo de la sesión y trae el estado y el total", async (t) => {
  const { pedir, consultas } = await levantarServidor(t);

  const { estado, cuerpo } = await pedir("/", CLIENTE);

  assert.equal(estado, 200);
  assert.equal(consultas[0].correo, ANA);
  assert.deepEqual(cuerpo.datos, [
    {
      numCarrito: 2,
      fecha: "2026-11-03T18:00:00.000Z",
      estado: "en_transito",
      modalidadEntrega: "mensajero",
      subtotal: 100,
      impuesto: 13,
      costoEntrega: 3.5,
      total: 116.5,
      moneda: "USD",
      unidades: 2,
    },
  ]);
});

test("el detalle trae las líneas, los pagos y la factura", async (t) => {
  const { pedir } = await levantarServidor(t);

  const { estado, cuerpo } = await pedir("/2", CLIENTE);

  assert.equal(estado, 200);
  assert.equal(cuerpo.datos.estado, "en_transito");
  assert.equal(cuerpo.datos.direccion, "San Pedro");
  assert.equal(cuerpo.datos.total, 116.5);
  assert.deepEqual(cuerpo.datos.lineas, [
    { sku: "LEG-001", nombre: "Halcón", cantidad: 2, precioUnitario: 50, subtotal: 100 },
  ]);
  assert.equal(cuerpo.datos.pagos[0].numReferencia, "SIM-1");
  assert.deepEqual(cuerpo.datos.factura, { numFactura: "F-1" });
  assert.equal(cuerpo.datos.creditoOtorgado, 5);
});

test("el cliente no recibe los datos internos del panel", async (t) => {
  const { pedir } = await levantarServidor(t);
  const internos = ["canal", "creadoPor", "nombreCreadoPor", "nombreDestinatario", "cliente", "correoCliente", "cedula", "telefonos", "historial", "estadosSiguientes", "lineasEditables", "productos"];

  const lista = await pedir("/", CLIENTE);
  const detalle = await pedir("/2", CLIENTE);

  for (const campo of internos) {
    assert.equal(Object.hasOwn(lista.cuerpo.datos[0], campo), false, `lista: ${campo}`);
    assert.equal(Object.hasOwn(detalle.cuerpo.datos, campo), false, `detalle: ${campo}`);
  }
});

test("el pedido de otro cliente responde 404 aunque el número exista", async (t) => {
  const { pedir, consultas } = await levantarServidor(t);

  const { estado } = await pedir("/2", { ...CLIENTE, "x-correo": "otra@correo.test" });

  assert.equal(estado, 404);
  assert.equal(consultas[0].correo, "otra@correo.test");
});

test("un pedido que no existe responde 404 y un número inválido 400", async (t) => {
  const { pedir } = await levantarServidor(t);

  assert.equal((await pedir("/9", CLIENTE)).estado, 404);
  assert.equal((await pedir("/abc", CLIENTE)).estado, 400);
  assert.equal((await pedir("/0", CLIENTE)).estado, 400);
});

test("mis pedidos son solo del cliente: sin sesión 401 y el administrador 403", async (t) => {
  const { pedir } = await levantarServidor(t);

  assert.equal((await pedir("/")).estado, 401);
  assert.equal((await pedir("/2")).estado, 401);
  assert.equal((await pedir("/", ADMINISTRADOR)).estado, 403);
  assert.equal((await pedir("/2", ADMINISTRADOR)).estado, 403);
});

test("/:numCarrito no se come a las rutas de /admin", async (t) => {
  const { pedir } = await levantarServidor(t);

  const delAdministrador = await pedir("/admin", ADMINISTRADOR);
  assert.equal(delAdministrador.estado, 200);
  assert.equal(delAdministrador.cuerpo.meta.total, 1);
  assert.equal((await pedir("/admin", CLIENTE)).estado, 403);
});
