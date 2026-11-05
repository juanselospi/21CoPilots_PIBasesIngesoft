import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { AdminService } from "./admin.service.js";
import { AdminController } from "./admin.controller.js";
import { crearRutasDeAdmin } from "./admin.routes.js";
import { crearExigirPropietario, crearExigirRol, ROLES } from "../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../shared/http/manejador-de-errores.js";
import { hashearToken } from "./seguridad/tokens-de-sesion.js";
import { verificarContrasena } from "./seguridad/contrasenas.js";
import { CORREO_DE_VENTA_SIN_CUENTA } from "../../shared/cuentas/venta-sin-cuenta.js";

const ANA = "ana@correo.test";
const NUEVA = "Nueva123!";

// Una "base" en memoria con las mismas reglas que la tabla: un enlace sirve
// una vez y solo antes de vencer.
function crearEscenario({ duracionMinutos = 30 } = {}) {
  const usuarios = new Map([
    [ANA, { correo: ANA, nombre: "Ana", rol: ROLES.CLIENTE, contrasenaHash: "viejo" }],
    ["inactivo@dchobbies.test", { correo: "inactivo@dchobbies.test", nombre: "Ex", rol: null, contrasenaHash: "x" }],
    [CORREO_DE_VENTA_SIN_CUENTA, { correo: CORREO_DE_VENTA_SIN_CUENTA, nombre: "Venta", rol: ROLES.CLIENTE, contrasenaHash: "x" }],
  ]);
  const enlaces = new Map();
  const sesionesCerradas = [];
  const avisos = [];

  const repositorio = {
    buscarUsuarioPorCorreo: async (correo) => usuarios.get(correo) ?? null,
    crearRecuperacion: async ({ correoUsuario, tokenHash, venceEn }) => {
      for (const [hash, enlace] of enlaces) {
        if (enlace.correo === correoUsuario && !enlace.usado) enlaces.delete(hash);
      }
      enlaces.set(tokenHash, { correo: correoUsuario, venceEn, usado: false });
    },
    restablecerContrasena: async ({ tokenHash, contrasenaHash }) => {
      const enlace = enlaces.get(tokenHash);
      if (!enlace || enlace.usado || enlace.venceEn <= new Date()) return null;
      enlace.usado = true;
      usuarios.get(enlace.correo).contrasenaHash = contrasenaHash;
      sesionesCerradas.push(enlace.correo);
      return enlace.correo;
    },
  };
  const servicio = new AdminService({
    repositorio,
    busDeEventos: { publicar: async () => {} },
    recuperacion: { duracionMinutos, urlDeLaTienda: "http://tienda.test", devolverEnlace: true },
    avisarEnlace: (correo, enlace) => avisos.push([correo, enlace]),
  });
  return { servicio, usuarios, enlaces, sesionesCerradas, avisos };
}

async function levantarServidor(servicio) {
  const bus = { publicar: async () => {} };
  const aplicacion = express();
  aplicacion.use(express.json());
  aplicacion.use((peticion, _respuesta, siguiente) => {
    peticion.usuario = null;
    siguiente();
  });
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
  const base = `http://localhost:${servidor.address().port}/api/admin/contrasena`;
  const enviar = async (ruta, cuerpo) => {
    const respuesta = await fetch(`${base}${ruta}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    return { estado: respuesta.status, cuerpo: respuesta.status === 204 ? null : await respuesta.json() };
  };
  return { enviar, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
}

const tokenDe = (enlace) => new URL(enlace).searchParams.get("token");

test("RF-54: el enlace sirve una vez, cambia la contraseña y cierra las sesiones", async (t) => {
  const { servicio, usuarios, sesionesCerradas, avisos } = crearEscenario();
  const { enviar, cerrar } = await levantarServidor(servicio);
  t.after(cerrar);

  const pedido = await enviar("/recuperacion", { correo: " Ana@Correo.test " });
  assert.equal(pedido.estado, 202);
  assert.match(pedido.cuerpo.datos.enlace, /^http:\/\/tienda\.test\/restablecer\?token=/);
  // El mismo enlace va al log, que hace de correo mientras no haya envío
  assert.deepEqual(avisos, [[ANA, pedido.cuerpo.datos.enlace]]);
  const token = tokenDe(pedido.cuerpo.datos.enlace);

  assert.equal((await enviar("/restablecimiento", { token, contrasenaNueva: NUEVA })).estado, 204);
  assert.equal(await verificarContrasena(NUEVA, usuarios.get(ANA).contrasenaHash), true);
  assert.deepEqual(sesionesCerradas, [ANA]);

  const otraVez = await enviar("/restablecimiento", { token, contrasenaNueva: "Otra123!" });
  assert.equal(otraVez.estado, 400);
  assert.equal(otraVez.cuerpo.error.codigo, "TOKEN_INVALIDO");
});

test("la respuesta no dice si el correo tiene cuenta", async (t) => {
  const { servicio, enlaces, avisos } = crearEscenario();
  const { enviar, cerrar } = await levantarServidor(servicio);
  t.after(cerrar);

  const existe = await enviar("/recuperacion", { correo: ANA });
  for (const correo of ["nadie@correo.test", "inactivo@dchobbies.test", CORREO_DE_VENTA_SIN_CUENTA]) {
    const otro = await enviar("/recuperacion", { correo });
    assert.equal(otro.estado, 202);
    assert.equal(otro.cuerpo.datos.mensaje, existe.cuerpo.datos.mensaje);
    assert.equal(otro.cuerpo.datos.enlace, undefined);
  }
  // Ni la cuenta desactivada ni la de ventas sin cuenta reciben enlace
  assert.equal(enlaces.size, 1);
  assert.equal(avisos.length, 1);

  assert.equal((await enviar("/recuperacion", { correo: "no-es-correo" })).estado, 400);
});

test("un enlace vencido o inventado no sirve", async () => {
  const vencido = crearEscenario({ duracionMinutos: -1 });
  const { enlace } = await vencido.servicio.solicitarRecuperacion({ correo: ANA });
  await assert.rejects(
    vencido.servicio.restablecerContrasena({ token: tokenDe(enlace), contrasenaNueva: NUEVA }),
    (error) => error.codigo === "TOKEN_INVALIDO"
  );

  const { servicio } = crearEscenario();
  for (const token of ["inventado", "", undefined]) {
    await assert.rejects(
      servicio.restablecerContrasena({ token, contrasenaNueva: NUEVA }),
      (error) => error.codigo === "TOKEN_INVALIDO"
    );
  }
});

test("una contraseña que no cumple la política no gasta el enlace", async () => {
  const { servicio, usuarios } = crearEscenario();
  const { enlace } = await servicio.solicitarRecuperacion({ correo: ANA });
  const token = tokenDe(enlace);

  await assert.rejects(
    servicio.restablecerContrasena({ token, contrasenaNueva: "corta" }),
    (error) => error.codigo === "ENTRADA_INVALIDA" && error.detalles.campos.includes("contrasenaNueva")
  );
  assert.equal(usuarios.get(ANA).contrasenaHash, "viejo");

  await servicio.restablecerContrasena({ token, contrasenaNueva: NUEVA });
});

test("pedir otro enlace deja sin efecto el anterior y solo se guarda el hash", async () => {
  const { servicio, enlaces } = crearEscenario();

  const primero = tokenDe((await servicio.solicitarRecuperacion({ correo: ANA })).enlace);
  const segundo = tokenDe((await servicio.solicitarRecuperacion({ correo: ANA })).enlace);

  assert.deepEqual([...enlaces.keys()], [hashearToken(segundo)]);
  await assert.rejects(servicio.restablecerContrasena({ token: primero, contrasenaNueva: NUEVA }));
  await servicio.restablecerContrasena({ token: segundo, contrasenaNueva: NUEVA });
});

test("en producción el enlace no viaja en la respuesta", async () => {
  const servicio = new AdminService({
    repositorio: {
      buscarUsuarioPorCorreo: async () => ({ correo: ANA, rol: ROLES.CLIENTE }),
      crearRecuperacion: async () => {},
    },
    recuperacion: { duracionMinutos: 30, urlDeLaTienda: "https://tienda", devolverEnlace: false },
    avisarEnlace: () => {},
  });

  assert.deepEqual(await servicio.solicitarRecuperacion({ correo: ANA }), { enlace: null });
});
