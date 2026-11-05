import test from "node:test";
import assert from "node:assert/strict";

import { ClientesService } from "./clientes.service.js";
import { DatoDuplicado, EntradaInvalida, RecursoNoEncontrado } from "../../shared/errores/errores-de-dominio.js";

const datos = {
  nombre: "Ana Mora",
  correo: "ana@correo.test",
  contrasena: "Clave#2026",
  cedula: "1-2345-6789",
  telefono: "88881234",
  direccion: "Heredia centro",
  aceptaTerminos: true,
};

// Base falsa con un cliente que ya tiene el correo cliente@correo.test y la
// cédula 111111111.
function crearServicio() {
  const registrados = [];
  const sesiones = [];
  const repositorio = {
    registrar: async (cliente) => {
      const repetidos = [];
      if (cliente.correo === "cliente@correo.test") repetidos.push("correo");
      if (cliente.cedula === "111111111") repetidos.push("cedula");
      if (repetidos.length === 0) registrados.push(cliente);
      return repetidos;
    },
  };
  const servicio = new ClientesService({
    repositorio,
    hashearContrasena: async (contrasena) => `hash:${contrasena}`,
    abrirSesion: async (usuario) => {
      sesiones.push(usuario);
      return { token: "token-nuevo", venceEn: new Date(), usuario };
    },
  });
  return { servicio, registrados, sesiones };
}

test("RF-32: guarda el cliente con la contraseña en hash y deja la sesión abierta como cliente", async () => {
  const { servicio, registrados, sesiones } = crearServicio();

  const { token, usuario } = await servicio.registrar(datos);

  assert.equal(token, "token-nuevo");
  assert.deepEqual(usuario, { correo: "ana@correo.test", nombre: "Ana Mora", rol: "cliente" });
  assert.equal(registrados[0].contrasenaHash, "hash:Clave#2026");
  assert.equal(registrados[0].contrasena, undefined);
  assert.equal(registrados[0].cedula, "123456789");
  assert.equal(sesiones.length, 1);
});

test("un correo o una cédula que ya tienen cuenta dan 409 con los dos campos y no abren sesión", async () => {
  const { servicio, sesiones } = crearServicio();

  await assert.rejects(
    servicio.registrar({ ...datos, correo: "cliente@correo.test", cedula: "1-1111-1111" }),
    (error) => {
      assert.ok(error instanceof DatoDuplicado);
      assert.deepEqual(error.detalles.campos, ["correo", "cedula"]);
      assert.equal(error.message, "Ya existe una cuenta con ese correo. Ya existe una cuenta con esa cédula.");
      return true;
    }
  );
  assert.equal(sesiones.length, 0);
});

test("datos inválidos no llegan a la base", async () => {
  const { servicio, registrados } = crearServicio();

  await assert.rejects(servicio.registrar({ ...datos, aceptaTerminos: false }), EntradaInvalida);
  assert.equal(registrados.length, 0);
});

// Mi cuenta

function crearServicioConCuenta() {
  const cuenta = {
    correo: "cliente@correo.test",
    nombre: "Cliente de Prueba",
    cedula: "1-1111-1111",
    direccion: "San Pedro",
    telefonos: ["8888-0001"],
    numeroDeCompras: 2,
    fechaAceptacionTerminos: new Date("2026-09-01T16:00:00Z"),
  };
  const repositorio = {
    obtenerPorCorreo: async (correo) => (correo === cuenta.correo ? { ...cuenta } : null),
    actualizarContacto: async (_correo, cambios) => Object.assign(cuenta, cambios),
    saldoDeCredito: async () => ({ otorgado: 30, usado: 12.5, saldo: 17.5 }),
    movimientosDeCredito: async () => [
      { tipo: "usado", fecha: new Date("2026-11-04T16:00:00Z"), monto: 12.5, motivo: null, numCarrito: 9 },
      { tipo: "otorgado", fecha: new Date("2026-11-03T16:00:00Z"), monto: 30, motivo: "Se quitaron 2 de LEG-001 del pedido 7", numCarrito: 7 },
    ],
  };
  return { servicio: new ClientesService({ repositorio }), cuenta };
}

test("RF-37: devuelve los datos de la cuenta del cliente", async () => {
  const { servicio } = crearServicioConCuenta();

  const cuenta = await servicio.obtenerMiCuenta("cliente@correo.test");

  assert.equal(cuenta.direccion, "San Pedro");
  assert.deepEqual(cuenta.telefonos, ["8888-0001"]);
  assert.equal(cuenta.saldoCredito, 17.5);
  await assert.rejects(servicio.obtenerMiCuenta("nadie@correo.test"), RecursoNoEncontrado);
});

test("el cliente ve su saldo a favor con lo que le otorgaron y lo que usó", async () => {
  const { servicio } = crearServicioConCuenta();

  const creditos = await servicio.obtenerMisCreditos("cliente@correo.test");

  assert.equal(creditos.saldo, 17.5);
  assert.deepEqual(creditos.movimientos.map(({ tipo, monto }) => [tipo, monto]), [
    ["usado", 12.5],
    ["otorgado", 30],
  ]);
});

test("cambiar la dirección se ve en la siguiente consulta", async () => {
  const { servicio } = crearServicioConCuenta();

  const actualizada = await servicio.actualizarMiCuenta("cliente@correo.test", {
    direccion: "Heredia",
    telefonos: ["8888 0002"],
  });

  assert.equal(actualizada.direccion, "Heredia");
  assert.deepEqual(actualizada.telefonos, ["8888-0002"]);
  assert.equal((await servicio.obtenerMiCuenta("cliente@correo.test")).direccion, "Heredia");
});

test("cambios inválidos no tocan la cuenta", async () => {
  const { servicio, cuenta } = crearServicioConCuenta();

  await assert.rejects(servicio.actualizarMiCuenta("cliente@correo.test", { direccion: "" }), EntradaInvalida);
  assert.equal(cuenta.direccion, "San Pedro");
});
