import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { EdicionDePedidosService } from "./edicion.service.js";
import { CreditosDePedidos } from "../creditos/creditos-de-pedidos.js";
import { PedidosController } from "../pedidos.controller.js";
import { crearRutasDePedidos } from "../pedidos.routes.js";
import { crearExigirRol, ROLES } from "../../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../../shared/http/manejador-de-errores.js";
import {
  EntradaInvalida,
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
  SinExistencias,
} from "../../../shared/errores/errores-de-dominio.js";
import { EVENTOS } from "../../../shared/eventos/eventos-de-dominio.js";

const ANA = "ana@correo.test";
const ADMIN = "admin@dchobbies.test";
const MOTIVO = `Pedido ${ANA}/7`;
const COMO_ADMIN = { responsable: ADMIN };

// Escenario: el pedido 7 de Ana tiene 2 LEG-001 a 100 y 4 BOO-001 a 10, de
// los que solo salió 1 (el resto quedó en contrapedido). La "base" solo
// guarda los cambios si la transacción termina bien.
function crearEscenario({ estadoDelPedido = "procesado", canal = "web", stock, cobrado = 0, costoEntrega = 3.5 } = {}) {
  const estado = {
    lineas: {
      "BOO-001": { sku: "BOO-001", cantidad: 4, precioUnitario: 10, tasaImpuesto: 13 },
      "LEG-001": { sku: "LEG-001", cantidad: 2, precioUnitario: 100, tasaImpuesto: 13 },
    },
    stock: stock ?? { "LEG-001": 1, "BOO-001": 0, "PKM-001": 10, "MTG-001": 0, "CAR-001": 5 },
    movimientos: [
      { sku: "BOO-001", cantidad: -1, motivo: MOTIVO },
      { sku: "LEG-001", cantidad: -2, motivo: MOTIVO },
    ],
    creditos: [],
  };
  const eventos = [];
  const producto = (sku, precioSinImpuesto, { contrapedido = false, aLaVenta = true } = {}) => ({
    sku,
    nombre: sku,
    precioSinImpuesto,
    tasaImpuesto: 13,
    precioFinal: Math.round(precioSinImpuesto * 113) / 100,
    admiteContrapedido: contrapedido,
    aLaVenta,
  });
  const catalogo = {
    "LEG-001": producto("LEG-001", 120),
    "BOO-001": producto("BOO-001", 10, { contrapedido: true }),
    "PKM-001": producto("PKM-001", 90),
    "MTG-001": producto("MTG-001", 50, { contrapedido: true }),
    "CAR-001": producto("CAR-001", 100.01),
    "VIE-001": producto("VIE-001", 5, { aLaVenta: false }),
  };

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
    bloquearPedido: async (_c, correo, numCarrito) => (correo === ANA && numCarrito === 7 ? { canal } : null),
    historialDeEstados: async () => [{ estado: "colocado" }, { estado: estadoDelPedido }],
    lineasDelPedido: async () => structuredClone(Object.values(estado.lineas)),
    costoDeEntrega: async () => costoEntrega,
    guardarLinea: async (_correo, _num, linea) => {
      estado.lineas[linea.sku] = { ...linea };
    },
    quitarLinea: async (_correo, _num, sku) => {
      delete estado.lineas[sku];
    },
  };
  const inventario = {
    unidadesQueSalieronEnTransaccion: async (_c, motivo) => {
      const netas = new Map();
      for (const m of estado.movimientos.filter((m) => m.motivo === motivo)) {
        netas.set(m.sku, (netas.get(m.sku) ?? 0) - m.cantidad);
      }
      return new Map([...netas].filter(([, unidades]) => unidades > 0));
    },
    bloquearEnTransaccion: async (_c, skus) =>
      new Map(skus.map((sku) => [sku, { sku, stock: estado.stock[sku], contrapedido: catalogo[sku]?.admiteContrapedido }])),
    registrarEnTransaccion: async (_c, movimiento) => {
      estado.stock[movimiento.sku] += movimiento.cantidad;
      estado.movimientos.push(movimiento);
      return movimiento;
    },
    publicarMovimientos: async (movimientos) => movimientos.forEach((m) => eventos.push(["movimiento", m.sku])),
  };
  const creditos = new CreditosDePedidos({
    pagos: { montoAprobado: async () => cobrado },
    clientes: {
      creditoOtorgadoPorPedido: async () => estado.creditos.reduce((suma, c) => suma + c.monto, 0),
      otorgarCreditoEnTransaccion: async (_c, credito) => estado.creditos.push(credito),
    },
  });
  const servicio = new EdicionDePedidosService({
    repositorio,
    inventario,
    productosParaVenta: async (skus) => new Map(skus.filter((sku) => catalogo[sku]).map((sku) => [sku, catalogo[sku]])),
    busDeEventos: { publicar: async (evento, datos) => eventos.push([evento, datos]) },
    creditos,
  });
  // Los movimientos que hizo la edición, sin los de la compra
  const nuevos = () => estado.movimientos.slice(2).map((m) => [m.sku, m.cantidad, m.tipo]);
  return { servicio, estado, eventos, nuevos };
}

test("bajar la cantidad devuelve solo lo que salió: lo de contrapedido se quita primero", async () => {
  const { servicio, estado, nuevos } = crearEscenario();

  // Pidió 4 y salió 1: bajar a 2 no devuelve nada
  await servicio.cambiarCantidad(ANA, 7, "BOO-001", { cantidad: 2 }, COMO_ADMIN);
  // Pidió 2 y salieron 2: bajar a 1 devuelve 1
  await servicio.cambiarCantidad(ANA, 7, "LEG-001", { cantidad: 1 }, COMO_ADMIN);

  assert.equal(estado.lineas["BOO-001"].cantidad, 2);
  assert.equal(estado.lineas["LEG-001"].cantidad, 1);
  assert.deepEqual(nuevos(), [["LEG-001", 1, "reposicion"]]);
  // La línea conserva el precio pagado aunque hoy cueste 120
  assert.equal(estado.lineas["LEG-001"].precioUnitario, 100);
});

test("subir la cantidad descuenta la diferencia y sin existencias ni contrapedido se rechaza", async () => {
  const { servicio, estado, nuevos } = crearEscenario();

  await assert.rejects(servicio.cambiarCantidad(ANA, 7, "LEG-001", { cantidad: 4 }, COMO_ADMIN), SinExistencias);
  assert.equal(estado.lineas["LEG-001"].cantidad, 2);

  await servicio.cambiarCantidad(ANA, 7, "LEG-001", { cantidad: 3 }, COMO_ADMIN);
  // Con contrapedido sale lo que hay (nada) y el resto queda pendiente
  await servicio.cambiarCantidad(ANA, 7, "BOO-001", { cantidad: 6 }, COMO_ADMIN);

  assert.deepEqual(nuevos(), [["LEG-001", -1, "venta_en_linea"]]);
  assert.equal(estado.stock["LEG-001"], 0);
});

test("quitar una línea devuelve lo que salió, pero el pedido no puede quedar vacío", async () => {
  const { servicio, estado, nuevos } = crearEscenario();

  await servicio.quitarLinea(ANA, 7, "LEG-001", COMO_ADMIN);
  assert.deepEqual(Object.keys(estado.lineas), ["BOO-001"]);
  assert.deepEqual(nuevos(), [["LEG-001", 2, "reposicion"]]);

  await assert.rejects(servicio.quitarLinea(ANA, 7, "BOO-001", COMO_ADMIN), ReglaDeNegocioViolada);
  await assert.rejects(servicio.quitarLinea(ANA, 7, "XYZ-001", COMO_ADMIN), RecursoNoEncontrado);
});

test("agregar un producto lo cobra al precio de hoy y descuenta el inventario", async () => {
  const { servicio, estado, nuevos } = crearEscenario();

  await servicio.agregarLinea(ANA, 7, { sku: "pkm-001", cantidad: 2 }, COMO_ADMIN);

  assert.deepEqual(estado.lineas["PKM-001"], { sku: "PKM-001", cantidad: 2, precioUnitario: 90, tasaImpuesto: 13 });
  assert.deepEqual(nuevos(), [["PKM-001", -2, "venta_en_linea"]]);
  await assert.rejects(servicio.agregarLinea(ANA, 7, { sku: "LEG-001", cantidad: 1 }, COMO_ADMIN), ReglaDeNegocioViolada);
  await assert.rejects(servicio.agregarLinea(ANA, 7, { sku: "VIE-001", cantidad: 1 }, COMO_ADMIN), ReglaDeNegocioViolada);
  await assert.rejects(servicio.agregarLinea(ANA, 7, { sku: "LEG-001" }, COMO_ADMIN), EntradaInvalida);
});

test("el reemplazo por uno de igual o menor precio conserva el precio pagado", async () => {
  const { servicio, estado, nuevos } = crearEscenario();

  await servicio.reemplazarLinea(ANA, 7, "LEG-001", { skuNuevo: "PKM-001" }, COMO_ADMIN);

  assert.equal(estado.lineas["LEG-001"], undefined);
  assert.deepEqual(estado.lineas["PKM-001"], { sku: "PKM-001", cantidad: 2, precioUnitario: 100, tasaImpuesto: 13 });
  assert.deepEqual(nuevos(), [
    ["LEG-001", 2, "reposicion"],
    ["PKM-001", -2, "venta_en_linea"],
  ]);
});

test("el reemplazo por uno más caro se rechaza, aunque sea por un centavo", async () => {
  const { servicio, estado } = crearEscenario();

  await assert.rejects(
    servicio.reemplazarLinea(ANA, 7, "LEG-001", { skuNuevo: "CAR-001" }, COMO_ADMIN),
    (error) => error instanceof ReglaDeNegocioViolada && /igual o menor precio/.test(error.message)
  );
  await assert.rejects(servicio.reemplazarLinea(ANA, 7, "LEG-001", { skuNuevo: "LEG-001" }, COMO_ADMIN), EntradaInvalida);
  assert.ok(estado.lineas["LEG-001"]);
});

test("un pedido en tránsito o finalizado ya no se edita y nada cambia", async () => {
  for (const estadoDelPedido of ["en_transito", "finalizado", "cancelado"]) {
    const { servicio, estado, eventos } = crearEscenario({ estadoDelPedido });

    await assert.rejects(servicio.quitarLinea(ANA, 7, "LEG-001", COMO_ADMIN), ReglaDeNegocioViolada);
    assert.equal(Object.keys(estado.lineas).length, 2);
    assert.equal(eventos.length, 0);
  }
});

test("en disputa sí se edita, y una venta de otro canal sale como venta externa", async () => {
  const { servicio, nuevos } = crearEscenario({ estadoDelPedido: "en_disputa", canal: "whatsapp" });

  await servicio.agregarLinea(ANA, 7, { sku: "PKM-001", cantidad: 1 }, COMO_ADMIN);

  assert.deepEqual(nuevos(), [["PKM-001", -1, "venta_externa"]]);
});

test("cada cambio queda en la bitácora con la línea anterior y la nueva", async () => {
  const { servicio, eventos, estado } = crearEscenario();

  await servicio.reemplazarLinea(ANA, 7, "LEG-001", { skuNuevo: "PKM-001" }, COMO_ADMIN);

  const [, datos] = eventos.find(([nombre]) => nombre === EVENTOS.PEDIDO_MODIFICADO);
  assert.deepEqual(datos, {
    correoUsuario: ADMIN,
    entidad: "pedido",
    entidadId: `${ANA}/7`,
    valorAnterior: { sku: "LEG-001", cantidad: 2, precioUnitario: 100 },
    valorNuevo: { sku: "PKM-001", cantidad: 2, precioUnitario: 100 },
  });
  assert.ok(estado.movimientos.slice(2).every((m) => m.correoAdministrador === ADMIN && m.motivo === MOTIVO));
});

test("en un pedido pagado, lo que se quita queda como crédito con impuesto", async () => {
  const { servicio, estado, eventos } = crearEscenario({ cobrado: 274.7 });

  await servicio.quitarLinea(ANA, 7, "LEG-001", COMO_ADMIN);
  await servicio.cambiarCantidad(ANA, 7, "BOO-001", { cantidad: 3 }, COMO_ADMIN);

  // 2 x 113 y 1 x 11,30
  assert.deepEqual(estado.creditos, [
    { correo: ANA, numCarrito: 7, monto: 226, motivo: "Se quitaron 2 de LEG-001 del pedido 7" },
    { correo: ANA, numCarrito: 7, monto: 11.3, motivo: "Se quitó 1 de BOO-001 del pedido 7" },
  ]);
  const quitada = eventos.find(([nombre]) => nombre === EVENTOS.PEDIDO_MODIFICADO)[1];
  assert.deepEqual(quitada.valorNuevo, { creditoOtorgado: 226 });
});

test("nunca se acredita más de lo cobrado ni hay crédito si el pedido no se pagó", async () => {
  // Pago 100 y al final se queda con 1 BOO-001 y el envio, que valen 14,80
  const pagadoAMedias = crearEscenario({ cobrado: 100 });
  await pagadoAMedias.servicio.quitarLinea(ANA, 7, "LEG-001", COMO_ADMIN);
  await pagadoAMedias.servicio.cambiarCantidad(ANA, 7, "BOO-001", { cantidad: 1 }, COMO_ADMIN);
  assert.deepEqual(pagadoAMedias.estado.creditos.map((c) => c.monto), [51.3, 33.9]);

  const sinPagar = crearEscenario();
  await sinPagar.servicio.quitarLinea(ANA, 7, "LEG-001", COMO_ADMIN);
  assert.deepEqual(sinPagar.estado.creditos, []);
});

test("agregar un producto y volver a quitarlo no deja credito", async () => {
  const { servicio, estado } = crearEscenario({ cobrado: 274.7 });

  await servicio.agregarLinea(ANA, 7, { sku: "PKM-001", cantidad: 1 }, COMO_ADMIN);
  const { credito } = await servicio.quitarLinea(ANA, 7, "PKM-001", COMO_ADMIN);

  assert.equal(credito, 0);
  assert.deepEqual(estado.creditos, []);
});

test("subir una cantidad y volver a bajarla no deja credito", async () => {
  const { servicio, estado } = crearEscenario({ cobrado: 274.7 });

  await servicio.cambiarCantidad(ANA, 7, "BOO-001", { cantidad: 6 }, COMO_ADMIN);
  await servicio.cambiarCantidad(ANA, 7, "BOO-001", { cantidad: 4 }, COMO_ADMIN);

  assert.deepEqual(estado.creditos, []);
});

test("si quita algo pagado despues de agregar otro, lo agregado se descuenta del credito", async () => {
  const { servicio, estado } = crearEscenario({ cobrado: 274.7 });

  await servicio.agregarLinea(ANA, 7, { sku: "PKM-001", cantidad: 1 }, COMO_ADMIN);
  await servicio.quitarLinea(ANA, 7, "LEG-001", COMO_ADMIN);

  // Se le quitaron 226 pero se queda con un PKM-001 de 101,70 que no pago
  assert.deepEqual(estado.creditos.map((c) => c.monto), [124.3]);
});

test("editar las líneas es solo del administrador y responde el pedido actualizado", async (t) => {
  const { servicio: edicion, estado } = crearEscenario();
  const servicio = { obtenerParaAdministracion: async () => detalleVacio() };
  const aplicacion = express();
  aplicacion.use(express.json());
  aplicacion.use((peticion, _respuesta, siguiente) => {
    const rol = peticion.get("x-rol");
    peticion.usuario = rol ? { correo: rol === ROLES.ADMINISTRADOR ? ADMIN : ANA, rol } : null;
    siguiente();
  });
  aplicacion.use(
    "/api/pedidos",
    crearRutasDePedidos(new PedidosController({ servicio, edicion }), { exigirRol: crearExigirRol({ publicar: async () => {} }) })
  );
  aplicacion.use(manejadorDeErrores);
  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  t.after(() => new Promise((resolver) => servidor.close(resolver)));
  const base = `http://localhost:${servidor.address().port}/api/pedidos/admin/ana%40correo.test/7/lineas`;
  const enviar = (metodo, ruta, rol, cuerpo) =>
    fetch(`${base}${ruta}`, {
      method: metodo,
      headers: { "content-type": "application/json", ...(rol ? { "x-rol": rol } : {}) },
      body: cuerpo && JSON.stringify(cuerpo),
    });

  assert.equal((await enviar("PATCH", "/LEG-001", ROLES.CLIENTE, { cantidad: 1 })).status, 403);
  assert.equal((await enviar("PATCH", "/leg-001", ROLES.ADMINISTRADOR, { cantidad: 1 })).status, 200);
  assert.equal((await enviar("POST", "", ROLES.ADMINISTRADOR, { sku: "PKM-001", cantidad: 1 })).status, 201);
  assert.equal((await enviar("POST", "/LEG-001/reemplazo", ROLES.ADMINISTRADOR, { skuNuevo: "CAR-001" })).status, 409);
  assert.equal((await enviar("DELETE", "/BOO-001", ROLES.ADMINISTRADOR)).status, 200);
  assert.deepEqual(Object.keys(estado.lineas).sort(), ["LEG-001", "PKM-001"]);
});

function detalleVacio() {
  return {
    estado: "procesado",
    subtotal: 0,
    impuesto: 0,
    costoEntrega: 0,
    total: 0,
    lineas: [],
    pagos: [],
    factura: null,
    historial: [],
    estadosSiguientes: [],
    lineasEditables: true,
  };
}
