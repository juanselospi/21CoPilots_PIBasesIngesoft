import test from "node:test";
import assert from "node:assert/strict";

import { incumplimientosDeLaPolitica, exigirPoliticaDeContrasenas } from "./politica-de-contrasenas.js";
import { EntradaInvalida } from "../../../shared/errores/errores-de-dominio.js";

test("acepta una contraseña que cumple las cuatro reglas", () => {
  for (const contrasena of ["Admin123!", "Ñandú#2026", "Ab1-cdef", "Clave_12345!"]) {
    assert.deepEqual(incumplimientosDeLaPolitica(contrasena), [], contrasena);
  }
});

test("una contraseña sin mayúscula se rechaza con ese motivo", () => {
  assert.throws(() => exigirPoliticaDeContrasenas("admin123!"), (error) => {
    assert.ok(error instanceof EntradaInvalida);
    assert.equal(error.message, "La contraseña debe tener al menos una mayúscula.");
    assert.deepEqual(error.detalles.campos, ["contrasena"]);
    return true;
  });
});

test("dice todo lo que falta en un solo mensaje", () => {
  assert.throws(() => exigirPoliticaDeContrasenas("abc", "nueva"), (error) => {
    assert.equal(
      error.message,
      "La contraseña debe tener de 8 a 12 caracteres, al menos una mayúscula, al menos un número y al menos un carácter especial."
    );
    assert.deepEqual(error.detalles.campos, ["nueva"]);
    return true;
  });
});

const CASOS = [
  ["7 caracteres", "Ab1!xyz", ["de 8 a 12 caracteres"]],
  ["13 caracteres", "Ab1!xyzxyzxyz", ["de 8 a 12 caracteres"]],
  ["sin número", "Admin!!!", ["al menos un número"]],
  ["sin carácter especial", "Admin1234", ["al menos un carácter especial"]],
];

for (const [caso, contrasena, esperado] of CASOS) {
  test(`rechaza: ${caso}`, () => {
    assert.deepEqual(incumplimientosDeLaPolitica(contrasena), esperado);
  });
}

test("los extremos de 8 y 12 caracteres son válidos", () => {
  assert.deepEqual(incumplimientosDeLaPolitica("Ab1!xyzw"), []);
  assert.deepEqual(incumplimientosDeLaPolitica("Ab1!xyzwxyzw"), []);
});

test("algo que no es texto no cumple ninguna regla", () => {
  assert.equal(incumplimientosDeLaPolitica(undefined).length, 4);
});
