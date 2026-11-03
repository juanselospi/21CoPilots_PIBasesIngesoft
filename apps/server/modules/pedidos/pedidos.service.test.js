import test from "node:test";
import assert from "node:assert/strict";

import { PedidosService } from "./pedidos.service.js";
import { totalConEntrega } from "./entrega/modalidades-de-entrega.js";
import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";

// Tarifas como las de pedidos.tarifa_envio, con montos de prueba.
const TARIFAS = [
  { modalidad: "mensajero", monto: 3.5 },
  { modalidad: "uber_flash", monto: 6 },
  { modalidad: "correos_cr", monto: 2.75 },
  { modalidad: "entrega_personal", monto: 0 },
];

const crearServicio = () => new PedidosService({ repositorio: { listarTarifas: async () => TARIFAS } });

test("RF-62: lista las cuatro modalidades con su costo y si piden dirección", async () => {
  const modalidades = await crearServicio().listarModalidades();

  assert.deepEqual(modalidades, [
    { modalidad: "mensajero", nombre: "Mensajero", costo: 3.5, exigeDireccion: true },
    { modalidad: "uber_flash", nombre: "Uber Flash", costo: 6, exigeDireccion: true },
    { modalidad: "correos_cr", nombre: "Correos de Costa Rica", costo: 2.75, exigeDireccion: true },
    { modalidad: "entrega_personal", nombre: "Entrega personal", costo: 0, exigeDireccion: false },
  ]);
});

test("RN-16: cada modalidad suma su costo al total del pedido", async () => {
  const servicio = crearServicio();

  for (const { modalidad, monto } of TARIFAS) {
    const { costoEntrega } = await servicio.cotizarEntrega({ modalidadEntrega: modalidad, direccion: "Heredia" });
    assert.equal(costoEntrega, monto);
    assert.equal(totalConEntrega({ subtotal: 100, impuesto: 13, costoEntrega }), 113 + monto);
  }
});

test("la cotización rechaza un envío sin dirección", async () => {
  await assert.rejects(crearServicio().cotizarEntrega({ modalidadEntrega: "uber_flash" }), EntradaInvalida);
});
