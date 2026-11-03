import test from "node:test";
import assert from "node:assert/strict";

import { crearValidacion, texto } from "./validar-campos.js";
import { EntradaInvalida } from "../errores/errores-de-dominio.js";

/** Error que lanza la validación, o null si no lanzó nada. */
function errorAlTerminar(validacion) {
  try {
    validacion.lanzarSiHayProblemas();
    return null;
  } catch (error) {
    return error;
  }
}

test("sin problemas no lanza nada", () => {
  const validacion = crearValidacion();

  assert.equal(validacion.hayProblemas, false);
  assert.equal(errorAlTerminar(validacion), null);
});

test("junta todos los campos con su mensaje en un solo error", () => {
  const validacion = crearValidacion();
  validacion.anotar("nombre", "El nombre es obligatorio.");
  validacion.anotar("correo", "El correo es obligatorio.");
  validacion.anotar("cedula", "La cédula es obligatoria.");

  const error = errorAlTerminar(validacion);

  assert.ok(error instanceof EntradaInvalida);
  assert.equal(error.message, "El nombre es obligatorio. El correo es obligatorio. La cédula es obligatoria.");
  assert.deepEqual(error.detalles.campos, ["nombre", "correo", "cedula"]);
  assert.deepEqual(error.detalles.errores, [
    { campo: "nombre", mensaje: "El nombre es obligatorio." },
    { campo: "correo", mensaje: "El correo es obligatorio." },
    { campo: "cedula", mensaje: "La cédula es obligatoria." },
  ]);
});

test("un mensaje que marca varios campos no se repite en el texto", () => {
  const validacion = crearValidacion();
  validacion.anotar(["precioMin", "precioMax"], "El mínimo no puede ser mayor que el máximo.");

  const error = errorAlTerminar(validacion);

  assert.equal(error.message, "El mínimo no puede ser mayor que el máximo.");
  assert.deepEqual(error.detalles.campos, ["precioMin", "precioMax"]);
  assert.equal(error.detalles.errores.length, 2);
});

test("hayProblemas cambia en cuanto se anota algo", () => {
  const validacion = crearValidacion();
  validacion.anotar("sku", "El código es obligatorio.");

  assert.equal(validacion.hayProblemas, true);
});

test("texto limpia los espacios y convierte lo vacío en null", () => {
  assert.equal(texto("  Pokémon "), "Pokémon");
  assert.equal(texto("   "), null);
  assert.equal(texto(""), null);
  assert.equal(texto(12), null);
  assert.equal(texto(undefined), null);
});
