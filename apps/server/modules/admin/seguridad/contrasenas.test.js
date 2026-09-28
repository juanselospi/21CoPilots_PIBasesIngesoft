import test from "node:test";
import assert from "node:assert/strict";

import { hashearContrasena, verificarContrasena } from "./contrasenas.js";

test("RNF-08: el hash no contiene la contraseña en claro", async () => {
  const hash = await hashearContrasena("Admin123!");

  assert.notEqual(hash, "Admin123!");
  assert.ok(!hash.includes("Admin123!"));
});

test("verifica la contraseña correcta y rechaza una incorrecta", async () => {
  const hash = await hashearContrasena("Admin123!");

  assert.equal(await verificarContrasena("Admin123!", hash), true);
  assert.equal(await verificarContrasena("admin123!", hash), false);
});

test("RNF-08: la misma contraseña produce hashes distintos (salt)", async () => {
  const hashUsuarioA = await hashearContrasena("Cliente123!");
  const hashUsuarioB = await hashearContrasena("Cliente123!");

  assert.notEqual(hashUsuarioA, hashUsuarioB);
  assert.equal(await verificarContrasena("Cliente123!", hashUsuarioA), true);
  assert.equal(await verificarContrasena("Cliente123!", hashUsuarioB), true);
});

test("verifica hashes creados por PostgreSQL en las semillas", async () => {
  // Generado con: SELECT crypt('Admin123!', gen_salt('bf', 10));
  const hashDePostgres = "$2a$10$1vuYiMqJwRihSl4xTujnxu7/C4bPZQcfg.BGDMjcFy7ox70upM9Ja";

  assert.equal(await verificarContrasena("Admin123!", hashDePostgres), true);
  assert.equal(await verificarContrasena("Otra123!", hashDePostgres), false);
});

// Test de contraseñas hechos con la ayuda de Claude