import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directorioDelServidor = path.dirname(fileURLToPath(import.meta.url));

// La configuración se lee una sola vez al importarla, así que cada caso
// corre en un proceso aparte con sus propias variables de entorno.
function configuracionDeSesionCon(variables) {
  const salida = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "import { configuracion } from './configuracion.js'; console.log(JSON.stringify(configuracion.sesion));",
    ],
    { cwd: directorioDelServidor, env: { ...process.env, ...variables }, encoding: "utf8" }
  );
  return JSON.parse(salida);
}

test("la duración y la renovación de la sesión salen de las variables de entorno", () => {
  const sesion = configuracionDeSesionCon({ DURACION_SESION_MINUTOS: "90", SESION_RENOVAR: "true" });

  assert.equal(sesion.duracionMinutos, 90);
  assert.equal(sesion.renovar, true);
});

test("la renovación solo se activa con SESION_RENOVAR=true", () => {
  assert.equal(configuracionDeSesionCon({ SESION_RENOVAR: "false" }).renovar, false);
  assert.equal(configuracionDeSesionCon({ SESION_RENOVAR: "si" }).renovar, false);
});
