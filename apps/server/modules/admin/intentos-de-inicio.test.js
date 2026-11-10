import test from "node:test";
import assert from "node:assert/strict";

import { AdminService } from "./admin.service.js";
import { crearLimiteDeIntentos } from "./seguridad/limite-de-intentos.js";
import { hashearContrasena } from "./seguridad/contrasenas.js";
import { CredencialesInvalidas, DemasiadosIntentos } from "../../shared/errores/errores-de-dominio.js";
import { manejadorDeErrores } from "../../shared/http/manejador-de-errores.js";

const CORREO = "cliente@correo.test";
const CONTRASENA = "Cliente123!";

async function crearServicio({ maximo = 3, bloqueoMinutos = 15 } = {}) {
  let momento = Date.UTC(2026, 10, 10, 12);
  const usuario = { correo: CORREO, nombre: "Cliente", rol: "cliente", contrasenaHash: await hashearContrasena(CONTRASENA) };
  const servicio = new AdminService({
    repositorio: {
      buscarUsuarioPorCorreo: async (correo) => (correo === CORREO ? usuario : null),
      borrarSesionesVencidas: async () => {},
      crearSesion: async () => {},
    },
    limiteDeIntentos: crearLimiteDeIntentos({ maximo, bloqueoMinutos, ahora: () => momento }),
  });
  const avanzarMinutos = (minutos) => (momento += minutos * 60 * 1000);
  const entrar = (contrasena, correo = CORREO) => servicio.iniciarSesion({ correo, contrasena });
  return { entrar, avanzarMinutos };
}

test("después de varios intentos fallidos se bloquea, aunque llegue la contraseña correcta", async () => {
  const { entrar } = await crearServicio({ maximo: 3 });

  await assert.rejects(entrar("Mala111!"), CredencialesInvalidas);
  await assert.rejects(entrar("Mala222!"), CredencialesInvalidas);
  // El tercero ya avisa del bloqueo
  await assert.rejects(entrar("Mala333!"), DemasiadosIntentos);
  await assert.rejects(entrar(CONTRASENA), (error) => error instanceof DemasiadosIntentos && error.detalles.reintentarEnSegundos === 900);
});

test("al pasar el bloqueo se puede entrar y los fallos se olvidan", async () => {
  const { entrar, avanzarMinutos } = await crearServicio({ maximo: 3, bloqueoMinutos: 15 });

  for (const mala of ["Mala111!", "Mala222!", "Mala333!"]) await entrar(mala).catch(() => {});
  avanzarMinutos(15);

  const { usuario } = await entrar(CONTRASENA);
  assert.equal(usuario.correo, CORREO);
  // Ya no arrastra los fallos de antes
  await assert.rejects(entrar("Mala444!"), CredencialesInvalidas);
});

test("un correo sin cuenta se bloquea igual, así no se sabe cuáles existen", async () => {
  const { entrar } = await crearServicio({ maximo: 2 });

  await assert.rejects(entrar("Mala111!", "nadie@correo.test"), CredencialesInvalidas);
  await assert.rejects(entrar("Mala222!", " Nadie@Correo.test "), DemasiadosIntentos);
});

test("el bloqueo responde 429 con el tiempo de espera", () => {
  let estado;
  let cuerpo;
  const respuesta = { status: (codigo) => ((estado = codigo), respuesta), json: (datos) => (cuerpo = datos) };

  manejadorDeErrores(new DemasiadosIntentos(840), {}, respuesta, () => {});

  assert.equal(estado, 429);
  assert.equal(cuerpo.error.codigo, "DEMASIADOS_INTENTOS");
  assert.equal(cuerpo.error.mensaje, "Demasiados intentos fallidos. Espere 14 minutos antes de volver a intentarlo.");
  assert.deepEqual(cuerpo.error.detalles, { reintentarEnSegundos: 840 });
});
