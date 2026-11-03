import test from "node:test";
import assert from "node:assert/strict";

import { CarritoService } from "./carrito.service.js";
import {
  EntradaInvalida,
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
} from "../../../shared/errores/errores-de-dominio.js";

// Catálogo: LEG-001 tiene 3 unidades, BOO-001 está agotado pero admite
// contrapedido y DES-001 está descontinuado.
const producto = (sku, nombre, precioSinImpuesto, existencias, admiteContrapedido, aLaVenta) => ({
  sku,
  nombre,
  precioSinImpuesto,
  tasaImpuesto: 13,
  existencias,
  admiteContrapedido,
  aLaVenta,
});
const CATALOGO = {
  "LEG-001": producto("LEG-001", "Halcón", 100, 3, false, true),
  "BOO-001": producto("BOO-001", "Booster", 10, 0, true, true),
  "DES-001": producto("DES-001", "Viejo", 5, 9, false, false),
};

// Base falsa de carritos que se conserva entre "sesiones"
function crearServicio() {
  const carritos = new Map();
  const repositorio = {
    obtenerCarritoActivo: async (correo) => {
      const carrito = carritos.get(correo);
      if (!carrito) return null;
      // Como el SQL, las líneas salen ordenadas por SKU
      const lineas = [...carrito.lineas.values()].sort((a, b) => a.sku.localeCompare(b.sku));
      return { numCarrito: carrito.numCarrito, lineas: lineas.map((l) => ({ ...l })) };
    },
    abrirCarrito: async (correo) => {
      if (!carritos.has(correo)) carritos.set(correo, { numCarrito: 1, lineas: new Map() });
      return carritos.get(correo).numCarrito;
    },
    guardarLinea: async (correo, _num, linea) => carritos.get(correo).lineas.set(linea.sku, { ...linea }),
    quitarLinea: async (correo, _num, sku) => carritos.get(correo).lineas.delete(sku),
  };
  const productosParaVenta = async (skus) =>
    new Map(skus.filter((sku) => CATALOGO[sku]).map((sku) => [sku, CATALOGO[sku]]));
  return { servicio: new CarritoService({ repositorio, productosParaVenta }), carritos };
}

const ANA = "ana@correo.test";

test("HU-10: agregar productos crea el carrito y guarda precio sin impuesto y tasa", async () => {
  const { servicio } = crearServicio();

  const carrito = await servicio.agregarLinea(ANA, { sku: "leg-001", cantidad: 2 });

  assert.equal(carrito.numCarrito, 1);
  assert.deepEqual(
    carrito.lineas.map((l) => [l.sku, l.cantidad, l.precioUnitario, l.tasaImpuesto]),
    [["LEG-001", 2, 100, 13]]
  );
  assert.deepEqual([carrito.subtotal, carrito.impuesto, carrito.total], [200, 26, 226]);
});

test("HU-10: el carrito se conserva y agregar el mismo producto suma a su línea", async () => {
  const { servicio } = crearServicio();
  await servicio.agregarLinea(ANA, { sku: "LEG-001", cantidad: 1 });

  // Otra sesión del mismo cliente
  const carrito = await servicio.agregarLinea(ANA, { sku: "LEG-001", cantidad: 1 });

  assert.equal(carrito.lineas[0].cantidad, 2);
  assert.equal((await servicio.verCarrito(ANA)).lineas[0].cantidad, 2);
});

test("RN-13: sin contrapedido no deja pasar de las existencias y dice el máximo", async () => {
  const { servicio } = crearServicio();
  await servicio.agregarLinea(ANA, { sku: "LEG-001", cantidad: 2 });

  await assert.rejects(servicio.agregarLinea(ANA, { sku: "LEG-001", cantidad: 2 }), (error) => {
    assert.ok(error instanceof ReglaDeNegocioViolada);
    assert.equal(error.message, "El máximo disponible es 3.");
    return true;
  });
  await assert.rejects(servicio.cambiarCantidad(ANA, "LEG-001", { cantidad: 4 }), ReglaDeNegocioViolada);
  assert.equal((await servicio.verCarrito(ANA)).lineas[0].cantidad, 2);
});

test("RF-23: con contrapedido acepta más de lo que hay y marca la línea", async () => {
  const { servicio } = crearServicio();

  const carrito = await servicio.agregarLinea(ANA, { sku: "BOO-001", cantidad: 5 });

  assert.equal(carrito.lineas[0].contrapedido, true);
});

test("RN-03: un producto que no está a la venta no entra al carrito", async () => {
  const { servicio } = crearServicio();

  await assert.rejects(servicio.agregarLinea(ANA, { sku: "DES-001", cantidad: 1 }), {
    message: "Viejo no está a la venta.",
  });
  await assert.rejects(servicio.agregarLinea(ANA, { sku: "NO-EXISTE", cantidad: 1 }), RecursoNoEncontrado);
});

test("cambiar la cantidad y quitar una línea", async () => {
  const { servicio } = crearServicio();
  await servicio.agregarLinea(ANA, { sku: "LEG-001", cantidad: 1 });
  await servicio.agregarLinea(ANA, { sku: "BOO-001", cantidad: 1 });

  assert.equal((await servicio.cambiarCantidad(ANA, "LEG-001", { cantidad: 3 })).lineas[1].cantidad, 3);
  const carrito = await servicio.quitarLinea(ANA, "BOO-001");

  assert.deepEqual(carrito.lineas.map((l) => l.sku), ["LEG-001"]);
  await assert.rejects(servicio.quitarLinea(ANA, "BOO-001"), RecursoNoEncontrado);
});

test("sin carrito devuelve uno vacío y una cantidad inválida responde con el campo", async () => {
  const { servicio } = crearServicio();

  const vacio = { numCarrito: null, lineas: [], subtotal: 0, impuesto: 0, total: 0 };
  assert.deepEqual(await servicio.verCarrito(ANA), vacio);
  await assert.rejects(servicio.agregarLinea(ANA, { sku: "LEG-001", cantidad: 0 }), (error) => {
    assert.ok(error instanceof EntradaInvalida);
    assert.deepEqual(error.detalles.campos, ["cantidad"]);
    return true;
  });
});
