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
      const sesion = sesiones.find((s) => s.tokenHash === tokenHash);
      const usuario = usuarios.find((u) => u.correo === sesion?.correoUsuario);
      return usuario ? { correo: usuario.correo, rol: usuario.rol } : null;
    },
  };
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
    correo: "admin@dchobbies.test",
    rol: "administrador",
  });
  assert.equal(await servicio.identificarPorToken("token-inventado"), null);
  assert.equal(await servicio.identificarPorToken(undefined), null);
});

// Test de los servicios del administrador hecho con la ayuda de Claude
