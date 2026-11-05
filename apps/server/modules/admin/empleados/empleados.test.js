import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";

import { AdminService } from "../admin.service.js";
import { AdminController } from "../admin.controller.js";
import { crearRutasDeAdmin } from "../admin.routes.js";
import { crearIdentificarUsuario } from "../../../shared/http/autenticacion.js";
import { crearExigirPropietario, crearExigirRol, ROLES } from "../../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../../shared/http/manejador-de-errores.js";
import {
  DatoDuplicado,
  EntradaInvalida,
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
} from "../../../shared/errores/errores-de-dominio.js";
import { EVENTOS } from "../../../shared/eventos/eventos-de-dominio.js";
import { verificarContrasena } from "../seguridad/contrasenas.js";

const DUENO = "admin@dchobbies.test";
const EMPLEADA = { nombre: "Laura Solís", correo: " Laura@DCHobbies.test ", contrasena: "Empleada1!" };

function crearEscenario() {
  const cuentas = new Map([
    [DUENO, { correo: DUENO, nombre: "Dueño", esPropietario: true, activo: true, creadoPor: null }],
  ]);
  const usuarios = new Set([DUENO, "cliente@correo.test"]);
  const hashes = new Map();
  const sesionesCerradas = [];
  const eventos = [];

  const repositorio = {
    crearEmpleado: async ({ nombre, correo, contrasenaHash, creadoPor }) => {
      if (usuarios.has(correo)) return false;
      usuarios.add(correo);
      hashes.set(correo, contrasenaHash);
      cuentas.set(correo, { correo, nombre, esPropietario: false, activo: true, creadoPor });
      return true;
    },
    listarAdministradores: async () => [...cuentas.values()],
    buscarAdministrador: async (correo) => (cuentas.has(correo) ? { ...cuentas.get(correo) } : null),
    cambiarActivo: async (correo, activo) => {
      cuentas.get(correo).activo = activo;
      if (!activo) sesionesCerradas.push(correo);
    },
  };
  const servicio = new AdminService({
    repositorio,
    busDeEventos: { publicar: async (evento, datos) => eventos.push([evento, datos]) },
  });
  return { servicio, cuentas, hashes, sesionesCerradas, eventos };
}

test("el propietario crea un empleado con la contraseña guardada como hash", async () => {
  const { servicio, hashes, eventos } = crearEscenario();

  const cuenta = await servicio.crearEmpleado(EMPLEADA, { responsable: DUENO });

  assert.deepEqual(cuenta, {
    correo: "laura@dchobbies.test",
    nombre: "Laura Solís",
    esPropietario: false,
    activo: true,
    creadoPor: DUENO,
  });
  assert.notEqual(hashes.get("laura@dchobbies.test"), "Empleada1!");
  assert.equal(await verificarContrasena("Empleada1!", hashes.get("laura@dchobbies.test")), true);
  assert.deepEqual(eventos[0], [
    EVENTOS.EMPLEADO_CREADO,
    {
      correoUsuario: DUENO,
      entidad: "administrador",
      entidadId: "laura@dchobbies.test",
      valorAnterior: null,
      valorNuevo: { nombre: "Laura Solís", activo: true },
    },
  ]);
});

test("la cuenta nueva sigue la política de contraseñas y no repite un correo", async () => {
  const { servicio } = crearEscenario();

  await assert.rejects(
    servicio.crearEmpleado({ ...EMPLEADA, contrasena: "corta" }, { responsable: DUENO }),
    (error) => error instanceof EntradaInvalida && error.detalles.campos.includes("contrasena")
  );
  await assert.rejects(
    servicio.crearEmpleado({ nombre: "", correo: "no-es-correo" }, { responsable: DUENO }),
    (error) => error instanceof EntradaInvalida && error.detalles.campos.join() === "nombre,correo,contrasena"
  );
  // Un correo que ya es de un cliente tampoco sirve
  await assert.rejects(
    servicio.crearEmpleado({ ...EMPLEADA, correo: "cliente@correo.test" }, { responsable: DUENO }),
    DatoDuplicado
  );
});

test("desactivar un empleado cierra sus sesiones y queda en la bitácora; el propietario no se desactiva", async () => {
  const { servicio, sesionesCerradas, eventos } = crearEscenario();
  await servicio.crearEmpleado(EMPLEADA, { responsable: DUENO });

  const cuenta = await servicio.cambiarActivo("LAURA@dchobbies.test", { activo: false }, { responsable: DUENO });

  assert.equal(cuenta.activo, false);
  assert.deepEqual(sesionesCerradas, ["laura@dchobbies.test"]);
  assert.deepEqual(eventos.at(-1)[1].valorNuevo, { activo: false });

  await assert.rejects(servicio.cambiarActivo(DUENO, { activo: false }, { responsable: DUENO }), ReglaDeNegocioViolada);
  await assert.rejects(servicio.cambiarActivo("nadie@dchobbies.test", { activo: true }, { responsable: DUENO }), RecursoNoEncontrado);
  await assert.rejects(servicio.cambiarActivo("laura@dchobbies.test", { activo: "no" }, { responsable: DUENO }), EntradaInvalida);
});

test("volver a mandar el mismo estado no publica nada", async () => {
  const { servicio, eventos } = crearEscenario();
  await servicio.crearEmpleado(EMPLEADA, { responsable: DUENO });

  await servicio.cambiarActivo("laura@dchobbies.test", { activo: true }, { responsable: DUENO });

  assert.equal(eventos.length, 1);
});

// Las rutas reales detrás de la misma cadena que app.js
async function levantarServidor(servicio) {
  const accesosDenegados = [];
  const bus = { publicar: async (evento, datos) => accesosDenegados.push([evento, datos]) };
  const sesiones = {
    "token-dueno": { correo: DUENO, nombre: "Dueño", rol: ROLES.ADMINISTRADOR, esPropietario: true },
    "token-empleado": { correo: "laura@dchobbies.test", nombre: "Laura", rol: ROLES.ADMINISTRADOR, esPropietario: false },
    "token-cliente": { correo: "cliente@correo.test", nombre: "Cliente", rol: ROLES.CLIENTE, esPropietario: false },
  };

  const aplicacion = express();
  aplicacion.use(express.json());
  aplicacion.use(cookieParser());
  aplicacion.use(crearIdentificarUsuario(async (token) => (sesiones[token] ? { usuario: sesiones[token] } : null)));
  aplicacion.use(
    "/api/admin",
    crearRutasDeAdmin(new AdminController({ servicio }), {
      exigirRol: crearExigirRol(bus),
      exigirPropietario: crearExigirPropietario(bus),
      recibirExcel: (_peticion, _respuesta, siguiente) => siguiente(),
    })
  );
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  const base = `http://localhost:${servidor.address().port}/api/admin/usuarios`;
  const pedir = (token, metodo = "GET", ruta = "", cuerpo) =>
    fetch(`${base}${ruta}`, {
      method: metodo,
      headers: { "content-type": "application/json", ...(token ? { cookie: `sesion=${token}` } : {}) },
      body: cuerpo && JSON.stringify(cuerpo),
    });
  return { pedir, accesosDenegados, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
}

test("solo el propietario gestiona empleados: un empleado recibe 403 y queda registrado", async (t) => {
  const { servicio } = crearEscenario();
  const { pedir, accesosDenegados, cerrar } = await levantarServidor(servicio);
  t.after(cerrar);

  assert.equal((await pedir(null)).status, 401);
  assert.equal((await pedir("token-cliente")).status, 403);
  assert.equal((await pedir("token-empleado", "POST", "", EMPLEADA)).status, 403);
  assert.deepEqual(accesosDenegados.at(-1), [
    EVENTOS.ACCESO_DENEGADO,
    {
      correoUsuario: "laura@dchobbies.test",
      entidad: "ruta",
      entidadId: "POST /api/admin/usuarios",
      valorNuevo: { rol: ROLES.ADMINISTRADOR },
    },
  ]);

  const creada = await pedir("token-dueno", "POST", "", EMPLEADA);
  assert.equal(creada.status, 201);
  assert.equal((await creada.json()).datos.correo, "laura@dchobbies.test");

  const { datos } = await (await pedir("token-dueno")).json();
  assert.deepEqual(datos.map((cuenta) => [cuenta.correo, cuenta.esPropietario, cuenta.activo]), [
    [DUENO, true, true],
    ["laura@dchobbies.test", false, true],
  ]);

  const desactivada = await pedir("token-dueno", "PATCH", "/laura%40dchobbies.test/activo", { activo: false });
  assert.equal(desactivada.status, 200);
  assert.equal((await desactivada.json()).datos.activo, false);
});
