import test from "node:test";
import assert from "node:assert/strict";

import { InventarioService } from "./inventario.service.js";
import { validarIngreso } from "./validar-ingreso.js";
import { EntradaInvalida, RecursoNoEncontrado } from "../../shared/errores/errores-de-dominio.js";

// Base falsa: LEG-001 tiene 3 unidades y cuesta 100. La transacción solo
// confirma si el trabajo termina bien.
function crearServicio() {
  const productos = new Map([["LEG-001", { sku: "LEG-001", stock: 3, item: 100 }]]);
  const movimientos = [];
  const eventos = [];
  const repositorio = {
    enTransaccion: async (trabajo) => {
      const copia = structuredClone([...productos]);
      const cuantos = movimientos.length;
      try {
        return await trabajo({});
      } catch (error) {
        productos.clear();
        copia.forEach(([sku, p]) => productos.set(sku, p));
        movimientos.length = cuantos;
        throw error;
      }
    },
    bloquearProductos: async (_cliente, skus) =>
      new Map(skus.filter((sku) => productos.has(sku)).map((sku) => [sku, productos.get(sku)])),
    actualizarCosto: async (_cliente, sku, costo) => {
      productos.get(sku).item = costo;
    },
    registrarMovimiento: async (_cliente, movimiento) => {
      const producto = productos.get(movimiento.sku);
      producto.stock += movimiento.cantidad;
      const registrado = { ...movimiento, fecha: new Date(), existenciasResultantes: producto.stock };
      movimientos.push(registrado);
      return registrado;
    },
  };
  const busDeEventos = { publicar: async (evento, datos) => eventos.push({ evento, datos }) };
  return { servicio: new InventarioService({ repositorio, busDeEventos }), productos, movimientos, eventos };
}

test("HU-07: ingresar 10 unidades sube el stock en 10 y deja el movimiento con su costo", async () => {
  const { servicio, productos, movimientos } = crearServicio();

  const movimiento = await servicio.registrarIngreso(
    { sku: "leg-001", cantidad: "10", costoUnitario: "120.50" },
    { responsable: "admin@dchobbies.test" }
  );

  assert.equal(productos.get("LEG-001").stock, 13);
  assert.equal(movimiento.existenciasResultantes, 13);
  assert.equal(movimientos[0].tipo, "ingreso");
  assert.equal(movimientos[0].costoUnitario, 120.5);
  assert.equal(movimientos[0].correoAdministrador, "admin@dchobbies.test");
  assert.ok(movimientos[0].fecha instanceof Date);
});

test("RF-14: el costo de la compra pasa a ser el del producto", async () => {
  const { servicio, productos } = crearServicio();

  await servicio.registrarIngreso(
    { sku: "LEG-001", cantidad: 1, costoUnitario: 95 },
    { responsable: "admin@dchobbies.test" }
  );

  assert.equal(productos.get("LEG-001").item, 95);
});

test("publica el movimiento después de guardarlo, para la alerta y la bitácora", async () => {
  const { servicio, eventos } = crearServicio();

  await servicio.registrarIngreso(
    { sku: "LEG-001", cantidad: 2, costoUnitario: 100 },
    { responsable: "admin@dchobbies.test" }
  );

  assert.equal(eventos[0].evento, "movimiento_registrado");
  assert.equal(eventos[0].datos.correoUsuario, "admin@dchobbies.test");
  assert.equal(eventos[0].datos.cantidad, 2);
  assert.equal(eventos[0].datos.existenciasResultantes, 5);
});

test("un producto que no existe responde no encontrado y no deja movimiento", async () => {
  const { servicio, movimientos, eventos } = crearServicio();

  await assert.rejects(
    servicio.registrarIngreso(
      { sku: "NO-EXISTE", cantidad: 1, costoUnitario: 1 },
      { responsable: "admin@dchobbies.test" }
    ),
    RecursoNoEncontrado
  );
  assert.equal(movimientos.length, 0);
  assert.deepEqual(eventos, []);
});

function camposConProblemas(datos) {
  try {
    validarIngreso(datos);
    return [];
  } catch (error) {
    assert.ok(error instanceof EntradaInvalida);
    return error.detalles.campos;
  }
}

test("una cantidad cero o negativa responde con el campo", () => {
  for (const cantidad of [0, -3, "2.5", "muchas"]) {
    assert.deepEqual(camposConProblemas({ sku: "LEG-001", cantidad, costoUnitario: 10 }), ["cantidad"], String(cantidad));
  }
});

test("informa todos los campos que faltan a la vez", () => {
  assert.deepEqual(camposConProblemas({}), ["sku", "cantidad", "costoUnitario"]);
  assert.deepEqual(camposConProblemas({ sku: "LEG-001", cantidad: 1, costoUnitario: "  " }), ["costoUnitario"]);
  assert.deepEqual(camposConProblemas({ sku: "LEG-001", cantidad: 1, costoUnitario: -1 }), ["costoUnitario"]);
});
