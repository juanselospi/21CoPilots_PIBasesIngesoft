import test from "node:test";
import assert from "node:assert/strict";

import { InventarioService } from "./inventario.service.js";

// Base falsa con el stock de cada producto; filtra igual que el SQL.
function crearServicio(stock) {
  const repositorio = {
    listarExistenciasBajas: async (umbral) =>
      Object.entries(stock)
        .filter(([, existencias]) => existencias <= umbral)
        .sort(([, a], [, b]) => a - b)
        .map(([sku, existencias]) => ({ sku, nombre: sku, familia: "Legos", existencias, admiteContrapedido: false })),
  };
  return new InventarioService({ repositorio, umbralDeExistenciasBajas: 2 });
}

test("RN-04: un producto que queda en 2 unidades aparece en las alertas", async () => {
  const stock = { "LEG-001": 3, "PKM-001": 10 };
  const servicio = crearServicio(stock);
  assert.deepEqual((await servicio.listarAlertas()).productos, []);

  stock["LEG-001"] -= 1; // se vende una unidad
  const { umbral, productos } = await servicio.listarAlertas();

  assert.equal(umbral, 2);
  assert.deepEqual(productos.map((p) => p.sku), ["LEG-001"]);
});

test("HU-08: un ingreso que sube el stock sobre el umbral quita la alerta", async () => {
  const stock = { "LEG-001": 2 };
  const servicio = crearServicio(stock);

  stock["LEG-001"] += 10; // ingreso de mercancía

  assert.deepEqual((await servicio.listarAlertas()).productos, []);
});

test("los más urgentes salen primero", async () => {
  const servicio = crearServicio({ "LEG-001": 2, "PKM-001": 0, "FUN-001": 1 });

  assert.deepEqual((await servicio.listarAlertas()).productos.map((p) => p.sku), ["PKM-001", "FUN-001", "LEG-001"]);
});
