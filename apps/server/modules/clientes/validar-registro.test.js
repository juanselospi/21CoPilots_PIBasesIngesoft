import test from "node:test";
import assert from "node:assert/strict";

import { validarRegistro } from "./validar-registro.js";
import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";

const valido = {
  nombre: "Ana Mora",
  correo: "Ana@Correo.test",
  contrasena: "Clave#2026",
  cedula: "1-2345-6789",
  telefono: "8888 1234",
  direccion: "Heredia centro",
  aceptaTerminos: true,
};

/** Campos marcados como malos, o [] si los datos pasan. */
function camposConProblemas(datos) {
  try {
    validarRegistro(datos);
    return [];
  } catch (error) {
    assert.ok(error instanceof EntradaInvalida);
    return error.detalles.campos;
  }
}

test("normaliza correo, cédula y teléfono", () => {
  assert.deepEqual(validarRegistro(valido), {
    nombre: "Ana Mora",
    correo: "ana@correo.test",
    contrasena: "Clave#2026",
    cedula: "123456789",
    telefono: "8888-1234",
    direccion: "Heredia centro",
  });
});

test("acepta cédula jurídica y DIMEX", () => {
  assert.equal(validarRegistro({ ...valido, cedula: "3-101-123456" }).cedula, "3101123456");
  assert.equal(validarRegistro({ ...valido, cedula: "155812345678" }).cedula, "155812345678");
});

test("RF-38: sin aceptar los términos responde con ese campo", () => {
  assert.deepEqual(camposConProblemas({ ...valido, aceptaTerminos: false }), ["aceptaTerminos"]);
  assert.deepEqual(camposConProblemas({ ...valido, aceptaTerminos: "true" }), ["aceptaTerminos"]);
});

test("una contraseña que no cumple la política dice lo que le falta", () => {
  assert.throws(() => validarRegistro({ ...valido, contrasena: "clave#2026" }), {
    message: "La contraseña debe tener al menos una mayúscula.",
  });
});

test("informa todos los campos con problemas a la vez", () => {
  assert.deepEqual(camposConProblemas({}), [
    "nombre",
    "correo",
    "contrasena",
    "cedula",
    "telefono",
    "direccion",
    "aceptaTerminos",
  ]);
});

const CASOS_INVALIDOS = [
  ["correo sin dominio", { correo: "ana@correo" }, "correo"],
  ["cédula de 8 dígitos", { cedula: "12345678" }, "cedula"],
  ["cédula con letras", { cedula: "1-1111-111A" }, "cedula"],
  ["teléfono de 7 dígitos", { telefono: "8888-888" }, "telefono"],
  ["teléfono con código de país", { telefono: "+506 8888-8888" }, "telefono"],
  ["nombre de más de 150 caracteres", { nombre: "X".repeat(151) }, "nombre"],
];

for (const [caso, cambios, campo] of CASOS_INVALIDOS) {
  test(`rechaza: ${caso}`, () => {
    assert.deepEqual(camposConProblemas({ ...valido, ...cambios }), [campo]);
  });
}
