import test from "node:test";
import assert from "node:assert/strict";

import { crearLimiteDeIntentos } from "./limite-de-intentos.js";

const MINUTO = 60 * 1000;

function crearReloj() {
  let momento = Date.UTC(2026, 10, 10, 12);
  return { ahora: () => momento, avanzar: (minutos) => (momento += minutos * MINUTO) };
}

test("al quinto fallo el correo queda bloqueado el tiempo configurado", () => {
  const reloj = crearReloj();
  const limite = crearLimiteDeIntentos({ maximo: 5, bloqueoMinutos: 15, ahora: reloj.ahora });

  for (let i = 0; i < 4; i++) limite.registrarFallo("ana@correo.test");
  assert.equal(limite.segundosDeBloqueo("ana@correo.test"), 0);

  limite.registrarFallo("ana@correo.test");
  assert.equal(limite.segundosDeBloqueo("ana@correo.test"), 15 * 60);

  reloj.avanzar(14);
  assert.equal(limite.segundosDeBloqueo("ana@correo.test"), 60);
  reloj.avanzar(1);
  assert.equal(limite.segundosDeBloqueo("ana@correo.test"), 0);
});

test("los fallos viejos salen de la ventana y no suman", () => {
  const reloj = crearReloj();
  const limite = crearLimiteDeIntentos({ maximo: 3, ventanaMinutos: 15, ahora: reloj.ahora });

  limite.registrarFallo("ana@correo.test");
  limite.registrarFallo("ana@correo.test");
  reloj.avanzar(16);
  limite.registrarFallo("ana@correo.test");

  assert.equal(limite.segundosDeBloqueo("ana@correo.test"), 0);
});

test("cada correo lleva su propia cuenta y entrar bien la borra", () => {
  const limite = crearLimiteDeIntentos({ maximo: 2 });

  limite.registrarFallo("ana@correo.test");
  limite.olvidar("ana@correo.test");
  limite.registrarFallo("ana@correo.test");
  limite.registrarFallo("otro@correo.test");

  assert.equal(limite.segundosDeBloqueo("ana@correo.test"), 0);
  assert.equal(limite.segundosDeBloqueo("otro@correo.test"), 0);
});
