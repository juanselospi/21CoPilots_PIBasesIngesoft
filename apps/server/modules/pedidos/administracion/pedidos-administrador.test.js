import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { validarConsultaDePedidos } from "./validar-consulta-de-pedidos.js";
import { PedidosService } from "../pedidos.service.js";
import { PedidosController } from "../pedidos.controller.js";
import { crearRutasDePedidos } from "../pedidos.routes.js";
import { crearExigirRol, ROLES } from "../../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../../shared/http/manejador-de-errores.js";
import { EntradaInvalida, RecursoNoEncontrado } from "../../../shared/errores/errores-de-dominio.js";

const camposConProblemas = (consulta) => {
  try {
    validarConsultaDePedidos(consulta);
    return [];
  } catch (error) {
    assert.ok(error instanceof EntradaInvalida);
    return error.detalles.campos;
  }
};

const PEDIDO_EN_LISTADO = Object.freeze({
  correoCliente: "ana@correo.test",
  nombreCliente: "Ana Mora",
  cedula: "1-1111-1111",
  numCarrito: 2,
  fecha: "2026-11-03T18:00:00.000Z",
  estado: "colocado",
  canal: "web",
  creadoPor: null,
  nombreDestinatario: null,
  modalidadEntrega: "mensajero",
  subtotal: 100,
  impuesto: 13.000000001,
  costoEntrega: 3.5,
  productos: [{ sku: "LEG-001", nombre: "Halcón", cantidad: 2 }],
  unidades: 2,
  estadoPago: "aprobado",
});

test("los filtros del listado se normalizan y la página por defecto es la 0 de 50", () => {
  const filtros = validarConsultaDePedidos({
    estado: " Colocado ",
    canal: "WhatsApp",
    correo: "Ana@Correo.test",
    q: "  halcón ",
    desde: "2026-11-01",
    hasta: "2026-11-03",
  });

  assert.equal(filtros.estado, "colocado");
  assert.equal(filtros.canal, "whatsapp");
  assert.equal(filtros.correo, "ana@correo.test");
  assert.equal(filtros.q, "halcón");
  // "hasta" incluye todo el día
  assert.equal(filtros.hasta.getTime() - filtros.desde.getTime(), 3 * 24 * 60 * 60 * 1000);
  assert.equal(filtros.pagina, 0);
  assert.equal(filtros.limite, 50);
});

test("el listado acepta el estado en disputa y rechaza estados, canales y fechas que no existen", () => {
  assert.equal(validarConsultaDePedidos({ estado: "en_disputa" }).estado, "en_disputa");
  assert.deepEqual(camposConProblemas({ estado: "perdido", canal: "correo", desde: "ayer" }), ["estado", "canal", "desde"]);
  assert.deepEqual(camposConProblemas({ desde: "2026-11-05", hasta: "2026-11-01" }), ["desde", "hasta"]);
  assert.deepEqual(camposConProblemas({ pagina: "-1", limite: "7" }), ["limite", "pagina"]);
});

test("el listado redondea los montos de la vista y suma el envío al total", async () => {
  const consultas = [];
  const servicio = new PedidosService({
    repositorio: {
      listarParaAdministracion: async (filtros) => {
        consultas.push(filtros);
        return { pedidos: [PEDIDO_EN_LISTADO], total: 1 };
      },
    },
  });

  const resultado = await servicio.listarParaAdministracion({ canal: "web", pagina: "1", limite: "25" });

  assert.equal(consultas[0].canal, "web");
  assert.equal(resultado.pagina, 1);
  assert.equal(resultado.limite, 25);
  assert.equal(resultado.total, 1);
  assert.equal(resultado.pedidos[0].impuesto, 13);
  assert.equal(resultado.pedidos[0].total, 116.5);
});

test("el detalle junta cliente, líneas con el precio pagado, pagos, factura e historial", async () => {
  const servicio = new PedidosService({
    repositorio: {
      obtenerParaAdministracion: async () => ({
        ...PEDIDO_EN_LISTADO,
        direccion: "San Pedro",
        fechaEntrega: null,
        nombreCreadoPor: null,
      }),
      lineasDelPedido: async () => [{ sku: "LEG-001", cantidad: 2, precioUnitario: 50, tasaImpuesto: 13 }],
      historialDeEstados: async () => [{ estado: "colocado", fecha: "2026-11-03T18:00:00.000Z" }],
    },
    clientes: {
      datosDeContacto: async () => ({ nombre: "Ana Mora", cedula: "1-1111-1111", telefonos: ["8888-8888"] }),
      creditoOtorgadoPorPedido: async () => 0,
    },
    pagos: {
      listarPorPedido: async () => [
        { numReferencia: "LOCAL-1", fecha: "2026-11-03T18:00:00.000Z", monto: 116.5, metodoPago: "tarjeta", estadoPago: "aprobado" },
      ],
    },
    facturas: { buscarPorPedido: async () => ({ numFactura: "F-1", fecha: "2026-11-03T18:00:00.000Z", numReferencia: "LOCAL-1" }) },
    // El precio de hoy no importa: la línea usa el que quedó congelado
    productosParaVenta: async () => new Map([["LEG-001", { nombre: "Halcón", precioSinImpuesto: 80 }]]),
  });

  const pedido = await servicio.obtenerParaAdministracion("ana@correo.test", 2);

  assert.deepEqual(pedido.telefonos, ["8888-8888"]);
  assert.deepEqual(pedido.lineas, [
    { sku: "LEG-001", cantidad: 2, precioUnitario: 50, tasaImpuesto: 13, nombre: "Halcón", subtotal: 100 },
  ]);
  assert.equal(pedido.pagos[0].numReferencia, "LOCAL-1");
  assert.equal(pedido.factura.numFactura, "F-1");
  assert.equal(pedido.historial.length, 1);
  assert.equal(pedido.total, 116.5);
});

test("el detalle de un pedido que no existe responde que no se encontró", async () => {
  const servicio = new PedidosService({ repositorio: { obtenerParaAdministracion: async () => null } });

  await assert.rejects(servicio.obtenerParaAdministracion("ana@correo.test", 9), RecursoNoEncontrado);
});

async function levantarServidor(servicio) {
  const aplicacion = express();
  aplicacion.use((peticion, _respuesta, siguiente) => {
    const rol = peticion.get("x-rol");
    peticion.usuario = rol ? { correo: "admin@dchobbies.test", rol } : null;
    siguiente();
  });
  aplicacion.use(
    "/api/pedidos",
    crearRutasDePedidos(new PedidosController({ servicio }), { exigirRol: crearExigirRol({ publicar: async () => {} }) })
  );
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  const base = `http://localhost:${servidor.address().port}/api/pedidos/admin`;
  return { base, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
}

test("el listado del panel es solo del administrador y responde con su total", async (t) => {
  const servicio = new PedidosService({
    repositorio: { listarParaAdministracion: async () => ({ pedidos: [PEDIDO_EN_LISTADO], total: 1 }) },
  });
  const { base, cerrar } = await levantarServidor(servicio);
  t.after(cerrar);
  const pedir = (rol, consulta = "") => fetch(`${base}${consulta}`, { headers: rol ? { "x-rol": rol } : {} });

  assert.equal((await pedir()).status, 401);
  assert.equal((await pedir(ROLES.CLIENTE)).status, 403);
  assert.equal((await pedir(ROLES.ADMINISTRADOR, "?canal=fax")).status, 400);

  const respuesta = await pedir(ROLES.ADMINISTRADOR, "?estado=colocado");
  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 200);
  assert.deepEqual(cuerpo.meta, { total: 1, pagina: 0, limite: 50 });
  assert.deepEqual(cuerpo.datos[0].cliente, { nombre: "Ana Mora", cedula: "1-1111-1111" });
  assert.deepEqual(cuerpo.datos[0].productos, [{ sku: "LEG-001", nombre: "Halcón", cantidad: 2 }]);
  assert.equal(cuerpo.datos[0].estado, "colocado");
  assert.equal(cuerpo.datos[0].estadoPago, "aprobado");
  assert.equal(cuerpo.datos[0].moneda, "USD");
});

test("el detalle del panel lee el correo y el número de la ruta", async (t) => {
  const pedidos = [];
  const servicio = {
    obtenerParaAdministracion: async (correo, numCarrito) => {
      pedidos.push([correo, numCarrito]);
      return {
        ...PEDIDO_EN_LISTADO,
        total: 116.5,
        telefonos: [],
        direccion: null,
        fechaEntrega: null,
        nombreCreadoPor: null,
        lineas: [],
        pagos: [],
        factura: null,
        historial: [],
      };
    },
  };
  const { base, cerrar } = await levantarServidor(servicio);
  t.after(cerrar);
  const pedir = (ruta) => fetch(`${base}${ruta}`, { headers: { "x-rol": ROLES.ADMINISTRADOR } });

  assert.equal((await pedir("/ana%40correo.test/cero")).status, 400);

  const respuesta = await pedir("/Ana%40Correo.test/2");
  const { datos } = await respuesta.json();

  assert.equal(respuesta.status, 200);
  assert.deepEqual(pedidos, [["ana@correo.test", 2]]);
  assert.equal(datos.factura, null);
  assert.deepEqual(datos.cliente.telefonos, []);
});
