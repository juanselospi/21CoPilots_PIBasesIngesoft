import test from "node:test";
import assert from "node:assert/strict";

import { ClientesService } from "./clientes.service.js";
import { DatoDuplicado, EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";

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
