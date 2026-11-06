import test from "node:test";
import assert from "node:assert/strict";

import { PedidosService } from "../pedidos.service.js";
import {
  EntradaInvalida,
  PagoRechazado,
  ReglaDeNegocioViolada,
  SinExistencias,
} from "../../../shared/errores/errores-de-dominio.js";

// Escenario: Ana tiene en el carrito 2 LEG-001 (hay 3) y 4 BOO-001 (hay 1,
// admite contrapedido). La "base" solo guarda los cambios si la transacción
// termina bien, como la real.
function crearEscenario({ resultadoDelPago = "aprobado", carrito, stock, saldo = 0 } = {}) {
  const estado = {
    carrito: carrito ?? {
      numCarrito: 7,
      lineas: [
        { sku: "BOO-001", cantidad: 4 },
        { sku: "LEG-001", cantidad: 2 },
      ],
    },
    stock: stock ?? { "LEG-001": 3, "BOO-001": 1 },
    pedidos: [],
    pagos: [],
    facturas: [],
    movimientos: [],
    compras: 0,
    precios: {},
    cobros: [],
  };
  const eventos = [];
  const producto = (sku, nombre, precioSinImpuesto, precioFinal, admiteContrapedido) => ({
    sku,
    nombre,
    precioSinImpuesto,
    precioFinal,
    tasaImpuesto: 13,
    admiteContrapedido,
    aLaVenta: true,
  });
  const catalogo = {
    "LEG-001": producto("LEG-001", "Halcón", 100, 113, false),
    "BOO-001": producto("BOO-001", "Booster", 10, 11.3, true),
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
    bloquearCarritoActivo: async () => (estado.carrito ? structuredClone(estado.carrito) : null),
    congelarPrecio: async (_c, _correo, _num, linea) => {
      estado.precios[linea.sku] = linea.precioUnitario;
    },
    crearPedido: async (_c, pedido) => {
      estado.pedidos.push({ ...pedido, estado: "colocado" });
      estado.carrito = null;
      return new Date("2026-11-03T20:00:00Z");
    },
  };
  const inventario = {
    bloquearEnTransaccion: async (_c, skus) => new Map(skus.map((sku) => [sku, { sku, stock: estado.stock[sku] }])),
    registrarEnTransaccion: async (_c, movimiento) => {
      estado.stock[movimiento.sku] += movimiento.cantidad;
      estado.movimientos.push(movimiento);
      return { ...movimiento, existenciasResultantes: estado.stock[movimiento.sku] };
    },
    publicarMovimientos: async (movimientos) => movimientos.forEach((m) => eventos.push(["movimiento", m.sku])),
  };
  const clientes = {
    sumarCompra: async () => (estado.compras += 1),
    datosParaFactura: async () => ({ nombre: "Ana Mora", cedula: "123456789" }),
    bloquearSaldoDeCredito: async () => saldo,
  };
  const facturas = {
    obtenerEmisor: async () => ({ razonSocial: "DC Hobbies", cedulaJuridica: "3-101-123456", direccion: "San José" }),
    registrar: async (_c, factura) => {
      estado.facturas.push(factura);
      return { ...factura, fecha: new Date() };
    },
  };
  const facturacionElectronica = {
    emitir: async ({ numReferencia, emisor, receptor }) => {
      estado.emitidaCon = { emisor, receptor };
      return { estado: "emitida", consecutivo: `FAC-${numReferencia}`, motivo: null };
    },
  };
  const pagos = {
    registrar: async (_c, pago) => {
      estado.pagos.push(pago);
      return { ...pago, fecha: new Date() };
    },
  };
  const pasarelaDePago = {
    cobrar: async ({ monto }) => (estado.cobros.push(monto), {
      resultado: resultadoDelPago,
      referencia: resultadoDelPago === "aprobado" ? `SIM-${monto}` : null,
      motivo: resultadoDelPago === "rechazado" ? "FONDOS_INSUFICIENTES" : null,
    }),
  };
  const busDeEventos = { publicar: async (evento) => eventos.push([evento]) };
  const productosParaVenta = async (skus) => new Map(skus.map((sku) => [sku, catalogo[sku]]));

  const servicio = new PedidosService({
    repositorio,
    inventario,
    clientes,
    busDeEventos,
    pasarelaDePago,
    productosParaVenta,
    pagos,
    facturas,
    facturacionElectronica,
  });
  return { servicio, estado, eventos, catalogo };
}

const ANA = "ana@correo.test";
const checkout = {
  modalidadEntrega: "mensajero",
  direccion: "Heredia",
  metodoPago: "tarjeta",
  datosTarjeta: { numero: "4111111111111111" },
};

test("HU-12: confirmar crea el pedido colocado, descuenta el stock y suma la compra", async () => {
  const { servicio, estado } = crearEscenario();

  const pedido = await servicio.confirmar(ANA, checkout);

  assert.equal(pedido.estado, "colocado");
  assert.equal(pedido.numCarrito, 7);
  assert.equal(estado.pedidos.length, 1);
  assert.equal(estado.pedidos[0].costoEntrega, 3.5);
  assert.equal(estado.stock["LEG-001"], 1);
  assert.equal(estado.compras, 1);
  assert.deepEqual(estado.movimientos.map((m) => [m.sku, m.cantidad, m.tipo]), [
    ["BOO-001", -1, "venta_en_linea"],
    ["LEG-001", -2, "venta_en_linea"],
  ]);
  // Así una cancelación sabe cuánto devolver
  assert.ok(estado.movimientos.every((m) => m.motivo === `Pedido ${ANA}/7`));
});

test("el precio queda congelado y el total suma el envío", async () => {
  const { servicio, estado } = crearEscenario();

  const pedido = await servicio.confirmar(ANA, checkout);

  assert.deepEqual(estado.precios, { "BOO-001": 10, "LEG-001": 100 });
  // 4 × 11,30 + 2 × 113 = 271,20; más 3,50 de envío
  assert.deepEqual([pedido.subtotal, pedido.impuesto, pedido.costoEntrega, pedido.total], [240, 31.2, 3.5, 274.7]);
});

test("RF-23: con contrapedido solo se descuenta lo que hay en stock", async () => {
  const { servicio, estado } = crearEscenario();

  await servicio.confirmar(ANA, checkout);

  assert.equal(estado.stock["BOO-001"], 0);
});

test("RF-30: si otro cliente se llevó las unidades, responde con las líneas y no crea nada", async () => {
  const { servicio, estado } = crearEscenario({ stock: { "LEG-001": 1, "BOO-001": 1 } });

  await assert.rejects(servicio.confirmar(ANA, checkout), (error) => {
    assert.ok(error instanceof SinExistencias);
    assert.deepEqual(error.detalles.lineas, [{ sku: "LEG-001", solicitadas: 2, disponibles: 1 }]);
    return true;
  });
  assert.equal(estado.pedidos.length, 0);
  assert.equal(estado.carrito.numCarrito, 7);
});

test("RF-39: un pago rechazado revierte todo y el carrito queda como estaba", async () => {
  const { servicio, estado, eventos } = crearEscenario({ resultadoDelPago: "rechazado" });

  await assert.rejects(servicio.confirmar(ANA, checkout), PagoRechazado);

  assert.equal(estado.pedidos.length, 0);
  assert.equal(estado.stock["LEG-001"], 3);
  assert.equal(estado.compras, 0);
  assert.deepEqual(estado.carrito.lineas.map((l) => l.sku), ["BOO-001", "LEG-001"]);
  assert.deepEqual(eventos, []);
});

test("contra entrega crea el pedido con el pago pendiente", async () => {
  const { servicio } = crearEscenario({ resultadoDelPago: "pendiente" });

  const pedido = await servicio.confirmar(ANA, { ...checkout, metodoPago: "contra_entrega", datosTarjeta: undefined });

  assert.equal(pedido.pago.resultado, "pendiente");
});

test("publica los movimientos y el pedido confirmado después de guardar", async () => {
  const { servicio, eventos } = crearEscenario();

  await servicio.confirmar(ANA, checkout);

  assert.deepEqual(eventos, [["movimiento", "BOO-001"], ["movimiento", "LEG-001"], ["pedido_confirmado"]]);
});

test("un carrito vacío no se confirma", async () => {
  const { servicio } = crearEscenario({ carrito: { numCarrito: 7, lineas: [] } });

  await assert.rejects(servicio.confirmar(ANA, checkout), ReglaDeNegocioViolada);
});

test("revisa todos los datos del checkout a la vez", async () => {
  const { servicio } = crearEscenario();

  await assert.rejects(servicio.confirmar(ANA, { modalidadEntrega: "mensajero", metodoPago: "tarjeta" }), (error) => {
    assert.ok(error instanceof EntradaInvalida);
    assert.deepEqual(error.detalles.campos, ["direccion", "datosTarjeta"]);
    return true;
  });
});

// Pagos (SCRUM-133)

test("un pago aprobado queda guardado con la referencia de la pasarela y sin datos de la tarjeta", async () => {
  const { servicio, estado } = crearEscenario();

  const pedido = await servicio.confirmar(ANA, checkout);

  assert.equal(estado.pagos.length, 1);
  assert.equal(estado.pagos[0].estadoPago, "aprobado");
  assert.equal(estado.pagos[0].numReferencia, pedido.pago.referencia);
  assert.equal(estado.pagos[0].monto, pedido.total);
  assert.ok(!JSON.stringify(estado.pagos[0]).includes("4111"));
});

test("contra entrega guarda el pago pendiente con una referencia local", async () => {
  const { servicio, estado } = crearEscenario({ resultadoDelPago: "pendiente" });

  await servicio.confirmar(ANA, { ...checkout, metodoPago: "contra_entrega", datosTarjeta: undefined });

  assert.equal(estado.pagos[0].estadoPago, "pendiente");
  assert.match(estado.pagos[0].numReferencia, /^LOCAL-/);
});

test("un pago rechazado no deja ni pedido ni pago", async () => {
  const { servicio, estado } = crearEscenario({ resultadoDelPago: "rechazado" });

  await assert.rejects(servicio.confirmar(ANA, checkout), PagoRechazado);

  assert.deepEqual(estado.pagos, []);
});

// Factura (SCRUM-134)

test("RF-41: con el pago aprobado se emite la factura con el emisor y la cédula del cliente", async () => {
  const { servicio, estado } = crearEscenario();

  const pedido = await servicio.confirmar(ANA, checkout);

  assert.equal(estado.facturas.length, 1);
  assert.equal(pedido.factura.numFactura, `FAC-${pedido.pago.referencia}`);
  assert.equal(estado.emitidaCon.emisor.cedulaJuridica, "3-101-123456");
  assert.equal(estado.emitidaCon.receptor.cedula, "123456789");
});

test("contra entrega no emite factura todavía", async () => {
  const { servicio, estado } = crearEscenario({ resultadoDelPago: "pendiente" });

  const pedido = await servicio.confirmar(ANA, { ...checkout, metodoPago: "contra_entrega", datosTarjeta: undefined });

  assert.equal(pedido.factura, null);
  assert.deepEqual(estado.facturas, []);
});

test("con crédito suficiente el pedido se paga sin pasarela y sin medio de pago", async () => {
  const { servicio, estado } = crearEscenario({ saldo: 500 });

  const pedido = await servicio.confirmar(ANA, { modalidadEntrega: "mensajero", direccion: "Heredia", usarCredito: true });

  assert.deepEqual(estado.cobros, []);
  assert.deepEqual(estado.pagos.map((p) => [p.metodoPago, p.monto, p.estadoPago]), [["credito", 274.7, "aprobado"]]);
  assert.match(estado.pagos[0].numReferencia, /^CREDITO-/);
  assert.equal(pedido.metodoPago, "credito");
  assert.equal(pedido.creditoUsado, 274.7);
  assert.equal(pedido.pago.resultado, "aprobado");
  assert.ok(pedido.factura);
});

test("con crédito parcial se cobra solo la diferencia con el otro medio", async () => {
  const { servicio, estado } = crearEscenario({ saldo: 100 });

  const pedido = await servicio.confirmar(ANA, { ...checkout, usarCredito: true });

  assert.deepEqual(estado.cobros, [174.7]);
  assert.deepEqual(estado.pagos.map((p) => [p.metodoPago, p.monto]), [
    ["credito", 100],
    ["tarjeta", 174.7],
  ]);
  assert.equal(pedido.creditoUsado, 100);
  assert.equal(pedido.total, 274.7);
});

test("si el crédito no alcanza y no hay medio de pago se pide uno, y un rechazo devuelve el crédito", async () => {
  const sinMedio = crearEscenario({ saldo: 100 });
  await assert.rejects(
    sinMedio.servicio.confirmar(ANA, { modalidadEntrega: "mensajero", direccion: "Heredia", usarCredito: true }),
    (error) => error instanceof EntradaInvalida && error.detalles.campos.includes("metodoPago")
  );
  assert.deepEqual(sinMedio.estado.pagos, []);

  const rechazado = crearEscenario({ saldo: 100, resultadoDelPago: "rechazado" });
  await assert.rejects(rechazado.servicio.confirmar(ANA, { ...checkout, usarCredito: true }), PagoRechazado);
  // La transacción se revierte entera: el uso del crédito tampoco queda
  assert.deepEqual(rechazado.estado.pagos, []);
});

test("sin pedir el crédito no se toca aunque haya saldo", async () => {
  const { servicio, estado } = crearEscenario({ saldo: 500 });

  const pedido = await servicio.confirmar(ANA, checkout);

  assert.deepEqual(estado.pagos.map((p) => p.metodoPago), ["tarjeta"]);
  assert.equal(pedido.creditoUsado, 0);
});

test("la factura de un pedido pagado en parte con crédito suma los dos pagos", async () => {
  const servicio = new PedidosService({
    repositorio: {
      lineasDelPedido: async () => [{ sku: "LEG-001", cantidad: 2, precioUnitario: 100, tasaImpuesto: 13 }],
      costoDeEntrega: async () => 3.5,
    },
    clientes: { datosParaFactura: async () => ({ nombre: "Ana Mora", cedula: "123456789" }) },
    pagos: { montoAprobado: async () => 229.5 },
    facturas: {
      buscarPorPedido: async () => ({ numFactura: "F-1", numReferencia: "SIM-1", montoCobrado: 129.5, metodoPago: "tarjeta" }),
      obtenerEmisor: async () => ({ razonSocial: "DC Hobbies" }),
    },
    productosParaVenta: async () => new Map([["LEG-001", { nombre: "Halcón" }]]),
  });

  const factura = await servicio.obtenerFactura(ANA, 7);

  assert.deepEqual([factura.subtotal, factura.impuesto, factura.costoEntrega, factura.total], [200, 26, 3.5, 229.5]);
});
