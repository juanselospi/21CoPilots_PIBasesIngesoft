import test from "node:test";
import assert from "node:assert/strict";

import { crearEnviadorDeCorreo } from "./index.js";
import { CorreoSimulado } from "./adaptadores/correo-simulado.js";
import { CorreoSmtp } from "./adaptadores/correo-smtp.js";

const SMTP = { host: "smtp.test", puerto: 465, usuario: "tienda@correo.test", contrasena: "clave", remitente: "" };

test("el adaptador simulado no ocupa credenciales", () => {
  assert.ok(crearEnviadorDeCorreo({ adaptador: "simulado", smtp: {} }) instanceof CorreoSimulado);
});

test("con smtp y todos los datos usa el adaptador real", () => {
  assert.ok(crearEnviadorDeCorreo({ adaptador: "smtp", smtp: SMTP }) instanceof CorreoSmtp);
});

test("con smtp y datos faltantes no arranca y dice cuales faltan", () => {
  assert.throws(
    () => crearEnviadorDeCorreo({ adaptador: "smtp", smtp: { host: "smtp.test", puerto: 465 } }),
    /SMTP_USUARIO, SMTP_CONTRASENA/
  );
});

test("un adaptador que no existe no arranca", () => {
  assert.throws(() => crearEnviadorDeCorreo({ adaptador: "paloma", smtp: {} }), /desconocido: "paloma"/);
});

test("el adaptador smtp arma el mensaje con el remitente configurado", async () => {
  const enviados = [];
  const correo = new CorreoSmtp(
    { ...SMTP, remitente: "DC Hobbies <tienda@correo.test>" },
    { sendMail: async (mensaje) => enviados.push(mensaje) }
  );

  await correo.enviar({ para: "ana@correo.test", asunto: "Hola", texto: "texto", html: "<p>html</p>" });

  assert.deepEqual(enviados, [
    {
      from: "DC Hobbies <tienda@correo.test>",
      to: "ana@correo.test",
      subject: "Hola",
      text: "texto",
      html: "<p>html</p>",
    },
  ]);
});
