import test from "node:test";
import assert from "node:assert/strict";

import { AdminService } from "./admin.service.js";
import { hashearContrasena } from "./seguridad/contrasenas.js";
import { hashearToken } from "./seguridad/tokens-de-sesion.js";
import { CredencialesInvalidas } from "../../shared/errores/errores-de-dominio.js";

/** Repositorio en memoria con un administrador y un cliente inactivo. */
async function crearRepositorioFalso() {
  const usuarios = [
    {
      id: 1,
      correo: "admin@dchobbies.test",
      nombre: "Administración",
      rol: "administrador",
      activo: true,
      contrasenaHash: await hashearContrasena("Admin123!"),
    },
    {
      id: 2,
      correo: "inactivo@correo.test",
      nombre: "Cuenta inactiva",
      rol: "cliente",
      activo: false,
      contrasenaHash: await hashearContrasena("Cliente123!"),
    },
  ];
  const sesiones = [];

  return {
    sesiones,
    async buscarUsuarioPorCorreo(correo) {
      return usuarios.find((u) => u.correo === correo.toLowerCase()) ?? null;
    },
    async crearSesion(sesion) {
      sesiones.push(sesion);
    },
    async buscarUsuarioPorSesion(tokenHash) {
      const sesion = sesiones.find((s) => s.tokenHash === tokenHash);
      const usuario = usuarios.find((u) => u.id === sesion?.usuarioId);
      return usuario ? { id: usuario.id, rol: usuario.rol } : null;
    },
  };
}

test("RF-53: con credenciales válidas abre una sesión y devuelve el rol", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio, duracionSesionHoras: 8 });

  const { token, venceEn, usuario } = await servicio.iniciarSesion({
    correo: "Admin@DCHobbies.test",
    contrasena: "Admin123!",
  });

  assert.equal(usuario.rol, "administrador");
  assert.equal(usuario.contrasenaHash, undefined);
  assert.equal(repositorio.sesiones.length, 1);

  const horas = (venceEn - Date.now()) / (60 * 60 * 1000);
  assert.ok(horas > 7.9 && horas <= 8);

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

test("una cuenta inactiva no puede iniciar sesión", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio });

  await assert.rejects(
    servicio.iniciarSesion({ correo: "inactivo@correo.test", contrasena: "Cliente123!" }),
    CredencialesInvalidas
  );
});

test("identifica al usuario a partir del token de la cookie", async () => {
  const repositorio = await crearRepositorioFalso();
  const servicio = new AdminService({ repositorio });

  const { token } = await servicio.iniciarSesion({
    correo: "admin@dchobbies.test",
    contrasena: "Admin123!",
  });

  assert.deepEqual(await servicio.identificarPorToken(token), {
    id: 1,
    rol: "administrador",
  });
  assert.equal(await servicio.identificarPorToken("token-inventado"), null);
  assert.equal(await servicio.identificarPorToken(undefined), null);
});
