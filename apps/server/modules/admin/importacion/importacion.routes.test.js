import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import express from "express";
import ExcelJS from "exceljs";

import { crearRutasDeAdmin } from "../admin.routes.js";
import { AdminController } from "../admin.controller.js";
import { crearRecibirExcel } from "./recibir-excel.js";
import { RUTA_DE_LA_PLANTILLA } from "./columnas.js";
import { crearExigirRol, ROLES } from "../../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../../shared/http/manejador-de-errores.js";

// Servicio falso: devuelve siempre el mismo resumen, con una fila rechazada.
const servicioConRechazo = {
  importarCatalogo: async () => ({
    leidas: 3,
    importadas: 1,
    actualizadas: 1,
    rechazadas: [{ linea: 4, fila: { codigoSku: "PS5-001", costo: NaN }, motivos: ["costo_usd no es un número."] }],
  }),
};

// Levanta las rutas reales de admin. La cabecera x-rol simula la sesión:
// sin ella no hay usuario.
async function levantarServidor({ tamanoMaximoMb = 5, servicio = servicioConRechazo } = {}) {
  const aplicacion = express();
  aplicacion.use((peticion, _respuesta, siguiente) => {
    const rol = peticion.get("x-rol");
    peticion.usuario = rol ? { correo: "admin@dchobbies.test", rol } : null;
    siguiente();
  });
  aplicacion.use(
    "/api/admin",
    crearRutasDeAdmin(new AdminController({ servicio }), {
      exigirRol: crearExigirRol({ publicar: async () => {} }),
      recibirExcel: crearRecibirExcel({ tamanoMaximoMb }),
    })
  );
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  const url = `http://localhost:${servidor.address().port}/api/admin/importaciones`;
  return { url, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
}

async function subir(url, { rol, archivo, nombre = "productos.xlsx", campo = "archivo" } = {}) {
  const formulario = new FormData();
  if (archivo) formulario.append(campo, new Blob([archivo]), nombre);
  const respuesta = await fetch(url, {
    method: "POST",
    body: formulario,
    headers: rol ? { "x-rol": rol } : {},
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}

const plantilla = await readFile(RUTA_DE_LA_PLANTILLA);

test("sin sesión responde 401", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado } = await subir(url, { archivo: plantilla });
  assert.equal(estado, 401);
});

test("un cliente recibe 403", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado } = await subir(url, { rol: ROLES.CLIENTE, archivo: plantilla });
  assert.equal(estado, 403);
});

test("el administrador recibe el resumen de la importación", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await subir(url, { rol: ROLES.ADMINISTRADOR, archivo: plantilla });
  const { reporte, ...resumen } = cuerpo.datos;

  assert.equal(estado, 200);
  assert.deepEqual(resumen, {
    leidas: 3,
    importadas: 1,
    actualizadas: 1,
    rechazadas: [{ fila: 4, codigoSku: "PS5-001", motivos: ["costo_usd no es un número."] }],
  });

  // Como hubo un rechazo, viene el reporte en Excel listo para descargar.
  assert.equal(reporte.nombreArchivo, "filas-rechazadas.xlsx");
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(Buffer.from(reporte.contenidoBase64, "base64"));
  assert.deepEqual(libro.worksheets[0].getRow(2).values.slice(1), [4, "PS5-001", "", "costo_usd no es un número."]);
});

test("sin filas rechazadas no viene reporte", async (t) => {
  const { url, cerrar } = await levantarServidor({
    servicio: { importarCatalogo: async () => ({ leidas: 1, importadas: 1, actualizadas: 0, rechazadas: [] }) },
  });
  t.after(cerrar);

  const { cuerpo } = await subir(url, { rol: ROLES.ADMINISTRADOR, archivo: plantilla });
  assert.equal(cuerpo.datos.reporte, null);
});

const CASOS_400 = [
  ["sin archivo", {}, /Falta el archivo/],
  ["archivo que no es .xlsx", { nombre: "productos.csv" }, /\.xlsx/],
  ["archivo en otro campo", { campo: "excel" }, /un solo archivo/],
];

for (const [caso, opciones, mensaje] of CASOS_400) {
  test(`responde 400: ${caso}`, async (t) => {
    const { url, cerrar } = await levantarServidor();
    t.after(cerrar);

    const archivo = caso === "sin archivo" ? undefined : plantilla;
    const { estado, cuerpo } = await subir(url, { rol: ROLES.ADMINISTRADOR, archivo, ...opciones });

    assert.equal(estado, 400);
    assert.match(cuerpo.error.mensaje, mensaje);
  });
}

test("responde 400 si el archivo pesa más de lo permitido", async (t) => {
  const { url, cerrar } = await levantarServidor({ tamanoMaximoMb: 0.001 });
  t.after(cerrar);

  const { estado, cuerpo } = await subir(url, { rol: ROLES.ADMINISTRADOR, archivo: plantilla });

  assert.equal(estado, 400);
  assert.match(cuerpo.error.mensaje, /pesa más de/);
});

test("el administrador descarga la plantilla; un cliente no", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const comoAdmin = await fetch(`${url}/plantilla`, { headers: { "x-rol": ROLES.ADMINISTRADOR } });
  const comoCliente = await fetch(`${url}/plantilla`, { headers: { "x-rol": ROLES.CLIENTE } });

  assert.equal(comoAdmin.status, 200);
  assert.match(comoAdmin.headers.get("content-disposition"), /plantilla-de-productos\.xlsx/);
  assert.deepEqual(Buffer.from(await comoAdmin.arrayBuffer()), plantilla);
  assert.equal(comoCliente.status, 403);
});

// Test de casos de importación del excel hecho con la ayuda de Claude
