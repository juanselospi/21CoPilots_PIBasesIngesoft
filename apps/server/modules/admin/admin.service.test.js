import test from "node:test";
import assert from "node:assert/strict";

import { AdminService } from "./admin.service.js";
import { hashearContrasena } from "./seguridad/contrasenas.js";
import { hashearToken } from "./seguridad/tokens-de-sesion.js";
import { CredencialesInvalidas } from "../../shared/errores/errores-de-dominio.js";

/** Repositorio en memoria con un administrador y un usuario que no es administrador ni cliente. */
async function crearRepositorioFalso() {
  const usuarios = [
    {
      correo: "admin@dchobbies.test",
      nombre: "Administración",
      rol: "administrador",
      contrasenaHash: await hashearContrasena("Admin123!"),
    },
    {
      correo: "sinrol@correo.test",
      nombre: "Usuario sin rol",
      rol: null,
      contrasenaHash: await hashearContrasena("Cliente123!"),
    },
  ];
  const sesiones = [];

  return {
    sesiones,
    async buscarUsuarioPorCorreo(correo) {
      return usuarios.find((u) => u.correo === correo) ?? null;
    },
    async crearSesion(sesion) {
      sesiones.push(sesion);
    },
    async buscarUsuarioPorSesion(tokenHash) {
      const sesion = sesiones.find((s) => s.tokenHash === tokenHash && s.venceEn > new Date());
      const usuario = usuarios.find((u) => u.correo === sesion?.correoUsuario);
      return usuario ? { correo: usuario.correo, rol: usuario.rol, venceEn: sesion.venceEn } : null;
    },
    async extenderSesion(tokenHash, venceEn) {
      sesiones.find((s) => s.tokenHash === tokenHash).venceEn = venceEn;
    },
    async borrarSesion(tokenHash) {
      quitarSesiones((s) => s.tokenHash === tokenHash);
    },
    async borrarSesionesVencidas(correoUsuario) {
      quitarSesiones((s) => s.correoUsuario === correoUsuario && s.venceEn <= new Date());
    },
  };

  function quitarSesiones(condicion) {
    for (let i = sesiones.length - 1; i >= 0; i--) {
      if (condicion(sesiones[i])) sesiones.splice(i, 1);
    }
  }
}

test("RF-53: con credenciales válidas abre una sesión y devuelve el rol", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio, duracionSesionMinutos: 25 });

  const { token, venceEn, usuario } = await servicio.iniciarSesion({
    correo: "  Admin@DCHobbies.test ",
    contrasena: "Admin123!",
  });

  assert.equal(usuario.rol, "administrador");
  assert.equal(repositorio.sesiones[0].correoUsuario, "admin@dchobbies.test");
  assert.equal(usuario.contrasenaHash, undefined);
  assert.equal(repositorio.sesiones.length, 1);

  const minutos = (venceEn - Date.now()) / (60 * 1000);
  assert.ok(minutos > 24.9 && minutos <= 25);

  assert.ok(token);
});

test("en la base de datos se guarda el hash del token, no el token", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio });

  const { token } = await servicio.iniciarSesion({
    correo: "admin@dchobbies.test",
    contrasena: "Admin123!",
  });

  const [sesion] = repositorio.sesiones;
  assert.notEqual(sesion.tokenHash, token);
  assert.equal(sesion.tokenHash, hashearToken(token));
});

test("rechaza una contraseña incorrecta sin abrir sesión", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio });

  await assert.rejects(
    servicio.iniciarSesion({ correo: "admin@dchobbies.test", contrasena: "otra" }),
    CredencialesInvalidas
  );
  assert.equal(repositorio.sesiones.length, 0);
});

test("un correo inexistente da el mismo error que una contraseña incorrecta", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio });

  await assert.rejects(
    servicio.iniciarSesion({ correo: "nadie@correo.test", contrasena: "Admin123!" }),
    CredencialesInvalidas
  );
});

test("un usuario que no es administrador ni cliente no puede iniciar sesión", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio });

  await assert.rejects(
    servicio.iniciarSesion({ correo: "sinrol@correo.test", contrasena: "Cliente123!" }),
    CredencialesInvalidas
  );
  assert.equal(repositorio.sesiones.length, 0);
});

test("identifica al usuario a partir del token de la cookie", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio });

  const { token } = await servicio.iniciarSesion({
    correo: "admin@dchobbies.test",
    contrasena: "Admin123!",
  });

  assert.deepEqual(await servicio.identificarPorToken(token), {
    usuario: { correo: "admin@dchobbies.test", rol: "administrador" },
    renovadaHasta: null,
  });
  assert.equal(await servicio.identificarPorToken("token-inventado"), null);
  assert.equal(await servicio.identificarPorToken(undefined), null);
});

const MINUTO = 60 * 1000;

/** Inicia sesión como administrador y devuelve el token y la sesión guardada. */
async function entrarComoAdministrador(servicio, repositorio) {
  const { token } = await servicio.iniciarSesion({ correo: "admin@dchobbies.test", contrasena: "Admin123!" });
  return { token, sesion: repositorio.sesiones.find((s) => s.tokenHash === hashearToken(token)) };
}

test("la duración de la sesión sale de la configuración", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio, duracionSesionMinutos: 90 });

  const { venceEn } = await servicio.iniciarSesion({ correo: "admin@dchobbies.test", contrasena: "Admin123!" });

  const minutos = (venceEn - Date.now()) / MINUTO;
  assert.ok(minutos > 89.9 && minutos <= 90);
});

test("una sesión vencida ya no identifica a nadie", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio });
  const { token, sesion } = await entrarComoAdministrador(servicio, repositorio);

  sesion.venceEn = new Date(Date.now() - MINUTO);

  assert.equal(await servicio.identificarPorToken(token), null);
});

test("con la renovación activa, una sesión que pasó la mitad de su duración se extiende", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio, duracionSesionMinutos: 20, renovarSesion: true });
  const { token, sesion } = await entrarComoAdministrador(servicio, repositorio);

  sesion.venceEn = new Date(Date.now() + 5 * MINUTO);
  const { renovadaHasta } = await servicio.identificarPorToken(token);

  const minutos = (renovadaHasta - Date.now()) / MINUTO;
  assert.ok(minutos > 19.9 && minutos <= 20);
  assert.equal(sesion.venceEn, renovadaHasta);
});

test("una sesión con más de la mitad de su tiempo no se renueva", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio, duracionSesionMinutos: 20, renovarSesion: true });
  const { token } = await entrarComoAdministrador(servicio, repositorio);

  assert.equal((await servicio.identificarPorToken(token)).renovadaHasta, null);
});

test("sin la renovación activa la sesión vence a su hora aunque se use", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio, duracionSesionMinutos: 20 });
  const { token, sesion } = await entrarComoAdministrador(servicio, repositorio);

  const venceAntes = new Date(Date.now() + 5 * MINUTO);
  sesion.venceEn = venceAntes;

  assert.equal((await servicio.identificarPorToken(token)).renovadaHasta, null);
  assert.equal(sesion.venceEn, venceAntes);
});

test("cerrar sesión borra la sesión de ese token", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio });
  const { token } = await entrarComoAdministrador(servicio, repositorio);

  await servicio.cerrarSesion(token);

  assert.equal(await servicio.identificarPorToken(token), null);
  assert.equal(repositorio.sesiones.length, 0);
  await servicio.cerrarSesion(undefined);
});

test("al iniciar sesión se borran las sesiones vencidas del usuario", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio });
  repositorio.sesiones.push({
    correoUsuario: "admin@dchobbies.test",
    tokenHash: "vieja",
    venceEn: new Date(Date.now() - MINUTO),
  });

  const { sesion } = await entrarComoAdministrador(servicio, repositorio);

  assert.deepEqual(repositorio.sesiones, [sesion]);
});

// Test de los servicios del administrador hecho con la ayuda de Claude
