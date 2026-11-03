import test from "node:test";
import assert from "node:assert/strict";

import { validarCambiosDeContacto } from "./validar-cambios-de-contacto.js";
import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";

function camposConProblemas(datos) {
  try {
    validarCambiosDeContacto(datos);
    return [];
  } catch (error) {
    assert.ok(error instanceof EntradaInvalida);
    return error.detalles.campos;
  }
}

test("devuelve solo lo que vino, con la dirección limpia y los teléfonos normalizados", () => {
  assert.deepEqual(validarCambiosDeContacto({ direccion: "  Heredia centro " }), { direccion: "Heredia centro" });
  assert.deepEqual(validarCambiosDeContacto({ telefonos: ["8888 1234", "22220000", "8888-1234"] }), {
    telefonos: ["8888-1234", "2222-0000"],
  });
});

test("la cédula no se cambia desde Mi cuenta", () => {
  assert.deepEqual(camposConProblemas({ cedula: "111111111" }), ["cedula"]);
});

const CASOS = [
  ["cuerpo vacío", {}, ["direccion", "telefonos"]],
  ["dirección vacía", { direccion: " " }, ["direccion"]],
  ["sin teléfonos", { telefonos: [] }, ["telefonos"]],
  ["teléfonos que no son lista", { telefonos: "8888-1234" }, ["telefonos"]],
  ["un teléfono mal escrito", { telefonos: ["8888-1234", "123"] }, ["telefonos"]],
  ["más de cinco teléfonos", { telefonos: Array(6).fill("8888-1234") }, ["telefonos"]],
];

for (const [caso, datos, campos] of CASOS) {
  test(`rechaza: ${caso}`, () => {
    assert.deepEqual(camposConProblemas(datos), campos);
  });
}
