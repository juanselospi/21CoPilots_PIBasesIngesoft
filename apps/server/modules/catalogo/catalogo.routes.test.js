import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { crearRutasDeCatalogo } from "./catalogo.routes.js";
import { CatalogoController } from "./catalogo.controller.js";
import { crearExigirRol, ROLES } from "../../shared/http/autorizacion-por-rol.js";
import { manejadorDeErrores } from "../../shared/http/manejador-de-errores.js";
import {
  EntradaInvalida,
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
} from "../../shared/errores/errores-de-dominio.js";

// Servicio falso: PKM-001 ya existe, un código vacío es inválido y el
// resto se registra. El listado del panel devuelve siempre el producto
// oculto y guarda los filtros que le llegaron.
const fun003 = {
  sku: "FUN-003",
  nombre: "Funko Pop! edición limitada convención",
  descripcion: "Sin existencias y sin contrapedido.",
  imagenUrl: null,
  categoria: "Coleccionables",
  proveedor: "Importadora Pop",
  precioFinal: 27289.5,
  disponibilidad: "no_disponible",
  admiteContrapedido: false,
  costoItem: 15000,
  porcentajeImportacion: 15,
  margenGanancia: 40,
  tasaImpuesto: 13,
  existencias: 0,
  desglosePrecio: [
    { paso: "costo", monto: 15000 },
    { paso: "importacion", monto: 17250 },
    { paso: "margen", monto: 24150 },
    { paso: "impuesto", monto: 27289.5 },
  ],
  etiquetas: ["existencias_bajas", "oculto_en_tienda"],
};
const filtrosDelPanel = [];
// Editar el precio: NO-EXISTE no existe, `precioFinal` no se acepta y el
// resto responde con el precio recalculado. Guarda los SKU que le llegaron.
const skusEditados = [];

const servicio = {
  listarCatalogo: async () => [],
  listarParaAdministracion: async (filtros) => {
    filtrosDelPanel.push(filtros);
    return { productos: [fun003], total: 14 };
  },
  crearProducto: async ({ sku }) => {
    if (!sku) throw new EntradaInvalida("El código es obligatorio.", ["sku"]);
    if (sku === "PKM-001") throw new ReglaDeNegocioViolada("Ya existe un producto con el código PKM-001.", "RF-01");
    return { sku, nombre: "Nuevo", categoria: "Trading Cards", precioFinal: 169.5, costoItem: 100, existencias: 0 };
  },
  actualizarPrecio: async (sku, datos) => {
    skusEditados.push(sku);
    if ("precioFinal" in datos) throw new EntradaInvalida("No se aceptan: precioFinal.", ["precioFinal"]);
    if (sku === "NO-EXISTE") throw new RecursoNoEncontrado("el producto", sku);
    return {
      sku,
      nombre: "Sobre Pokémon TCG Escarlata y Púrpura",
      costoItem: 1000,
      porcentajeImportacion: 20,
      margenGanancia: 25,
      tasaImpuesto: 13,
      precioFinal: 1695,
      desglosePrecio: [
        { paso: "costo", monto: 1000 },
        { paso: "importacion", monto: 1200 },
        { paso: "margen", monto: 1500 },
        { paso: "impuesto", monto: 1695 },
      ],
      etiquetas: [],
    };
  },
};

// La cabecera x-rol simula la sesión; sin ella no hay usuario.
async function levantarServidor() {
  const aplicacion = express();
  aplicacion.use(express.json());
  aplicacion.use((peticion, _respuesta, siguiente) => {
    const rol = peticion.get("x-rol");
    peticion.usuario = rol ? { correo: "prueba@correo.test", rol } : null;
    siguiente();
  });
  aplicacion.use(
    "/api/catalogo",
    crearRutasDeCatalogo(new CatalogoController({ servicio }), {
      exigirRol: crearExigirRol({ publicar: async () => {} }),
    })
  );
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  const url = `http://localhost:${servidor.address().port}/api/catalogo/productos`;
  const urlDelPanel = `http://localhost:${servidor.address().port}/api/catalogo/admin/productos`;
  return { url, urlDelPanel, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
}

async function listarEnElPanel(url, rol) {
  const respuesta = await fetch(url, { headers: rol ? { "x-rol": rol } : {} });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}

async function editarPrecio(url, sku, cambios, rol) {
  const respuesta = await fetch(`${url}/${sku}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...(rol ? { "x-rol": rol } : {}) },
    body: JSON.stringify(cambios),
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}

async function registrar(url, producto, rol) {
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(rol ? { "x-rol": rol } : {}) },
    body: JSON.stringify(producto),
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}

test("registrar un producto exige sesión de administrador", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  assert.equal((await registrar(url, { sku: "NUEVO-1" })).estado, 401);
  assert.equal((await registrar(url, { sku: "NUEVO-1" }, ROLES.CLIENTE)).estado, 403);
});

test("el administrador registra un producto y recibe 201 con su precio", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await registrar(url, { sku: "NUEVO-1" }, ROLES.ADMINISTRADOR);

  assert.equal(estado, 201);
  assert.equal(cuerpo.datos.sku, "NUEVO-1");
  assert.equal(cuerpo.datos.precioFinal, 169.5);
  assert.equal(cuerpo.datos.costoItem, 100);
});

test("un código repetido responde 409 con un mensaje claro", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await registrar(url, { sku: "PKM-001" }, ROLES.ADMINISTRADOR);

  assert.equal(estado, 409);
  assert.equal(cuerpo.error.mensaje, "Ya existe un producto con el código PKM-001.");
});

test("datos inválidos responden 400 con los campos a corregir", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await registrar(url, { sku: "" }, ROLES.ADMINISTRADOR);

  assert.equal(estado, 400);
  assert.deepEqual(cuerpo.error.detalles.campos, ["sku"]);
});

test("las consultas del catálogo siguen siendo públicas", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  assert.equal((await fetch(url)).status, 200);
});

test("el listado del panel responde 401 sin sesión y 403 a un cliente", async (t) => {
  const { urlDelPanel, cerrar } = await levantarServidor();
  t.after(cerrar);

  assert.equal((await listarEnElPanel(urlDelPanel)).estado, 401);

  const { estado, cuerpo } = await listarEnElPanel(urlDelPanel, ROLES.CLIENTE);
  assert.equal(estado, 403);
  assert.equal(cuerpo.datos, undefined);
});

test("el administrador ve el listado del panel con costo, desglose, etiquetas y total", async (t) => {
  const { urlDelPanel, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await listarEnElPanel(urlDelPanel, ROLES.ADMINISTRADOR);

  assert.equal(estado, 200);
  assert.deepEqual(cuerpo.meta, { total: 14, pagina: 0, limite: 24 });
  for (const producto of cuerpo.datos) {
    assert.equal(typeof producto.costoItem, "number");
    assert.equal(producto.desglosePrecio.length, 4);
  }
  assert.deepEqual(cuerpo.datos[0], { ...fun003, moneda: "CRC" });
});

test("el listado del panel le pasa al servicio los filtros de la consulta", async (t) => {
  const { urlDelPanel, cerrar } = await levantarServidor();
  t.after(cerrar);
  filtrosDelPanel.length = 0;

  const consulta =
    "?q=%20pkm%20&categoria=Juguetes&proveedor=Games%20Import&disponibilidad=no_disponible" +
    "&existenciasBajas=true&margenNegativo=false&precioMin=5000&precioMax=9000.5&orden=-precio&limite=48&pagina=2";
  const { estado, cuerpo } = await listarEnElPanel(urlDelPanel + consulta, ROLES.ADMINISTRADOR);

  assert.equal(estado, 200);
  assert.deepEqual(cuerpo.meta, { total: 14, pagina: 2, limite: 48 });
  assert.deepEqual(filtrosDelPanel, [
    {
      termino: "pkm",
      categoria: "Juguetes",
      proveedor: "Games Import",
      disponibilidad: "no_disponible",
      existenciasBajas: true,
      margenNegativo: false,
      precioMin: 5000,
      precioMax: 9000.5,
      orden: "-precio",
      limite: 48,
      desplazamiento: 96,
    },
  ]);
});

test("un parámetro inválido en el listado del panel responde 400 con los campos a corregir", async (t) => {
  const { urlDelPanel, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await listarEnElPanel(`${urlDelPanel}?orden=fecha&limite=10`, ROLES.ADMINISTRADOR);

  assert.equal(estado, 400);
  assert.equal(cuerpo.error.codigo, "ENTRADA_INVALIDA");
  assert.deepEqual(cuerpo.error.detalles.campos, ["orden", "limite"]);
});

test("el producto registrado sale con etiquetas aunque el servicio no las mande", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { cuerpo } = await registrar(url, { sku: "NUEVO-1" }, ROLES.ADMINISTRADOR);

  assert.deepEqual(cuerpo.datos.etiquetas, []);
});

const nuevoPrecio = { costoItem: 1000, porcentajeImportacion: 20, margenGanancia: 25 };

test("editar el precio responde 401 sin sesión y 403 a un cliente", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  assert.equal((await editarPrecio(url, "PKM-001", nuevoPrecio)).estado, 401);
  assert.equal((await editarPrecio(url, "PKM-001", nuevoPrecio, ROLES.CLIENTE)).estado, 403);
});

test("el administrador edita el precio y recibe 200 con el precio recalculado", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await editarPrecio(url, "PKM-001", nuevoPrecio, ROLES.ADMINISTRADOR);

  assert.equal(estado, 200);
  assert.equal(cuerpo.datos.precioFinal, 1695);
  assert.equal(cuerpo.datos.costoItem, 1000);
  assert.deepEqual(
    cuerpo.datos.desglosePrecio.map(({ monto }) => monto),
    [1000, 1200, 1500, 1695]
  );
});

test("un cuerpo inválido al editar el precio responde 400 con los campos a corregir", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await editarPrecio(url, "PKM-001", { precioFinal: 5000 }, ROLES.ADMINISTRADOR);

  assert.equal(estado, 400);
  assert.deepEqual(cuerpo.error.detalles.campos, ["precioFinal"]);
});

test("editar el precio de un SKU que no existe responde 404", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await editarPrecio(url, "NO-EXISTE", nuevoPrecio, ROLES.ADMINISTRADOR);

  assert.equal(estado, 404);
  assert.equal(cuerpo.error.codigo, "RECURSO_NO_ENCONTRADO");
});

test("el SKU de la URL se normaliza antes de editar el precio", async (t) => {
  const { url, cerrar } = await levantarServidor();
  t.after(cerrar);
  skusEditados.length = 0;

  const { estado, cuerpo } = await editarPrecio(url, "pkm-001", nuevoPrecio, ROLES.ADMINISTRADOR);

  assert.equal(estado, 200);
  assert.deepEqual(skusEditados, ["PKM-001"]);
  assert.equal(cuerpo.datos.sku, "PKM-001");
});
