import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { crearRutasDeCatalogo } from "./catalogo.routes.js";
import { CatalogoController } from "./catalogo.controller.js";
import { validarProductoNuevo } from "./validar-producto-nuevo.js";
import { FamiliasService } from "./familias.service.js";
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
  // la importación sale de la familia y el margen es propio
  heredado: { porcentajeImportacion: true, margenGanancia: false },
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
  listarFamilias: async () => [{ nombre: "Legos", cantidadDeProductos: 3 }],
  listarParaAdministracion: async (filtros) => {
    filtrosDelPanel.push(filtros);
    return { productos: [fun003], total: 14 };
  },
  crearProducto: async ({ sku }) => {
    if (!sku) throw new EntradaInvalida("El código es obligatorio.", ["sku"]);
    if (sku === "PKM-001") throw new ReglaDeNegocioViolada("Ya existe un producto con el código PKM-001.", "RF-01");
    return { sku, nombre: "Nuevo", categoria: "Trading Cards", precioFinal: 169.5, costoItem: 100, existencias: 0 };
  },
  actualizarProducto: async (sku, datos) => {
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

// Familias reales sobre una base en memoria: Legos tiene productos y
// Funkos no. Cada servidor arranca con las dos.
function crearFamilias() {
  const familias = new Map([
    ["legos", { nombre: "Legos", descripcion: null, porcentajeImportacion: 15, margenGanancia: 18, activa: true, totalDeProductos: 2 }],
    ["funkos", { nombre: "Funkos", descripcion: null, porcentajeImportacion: 0, margenGanancia: 0, activa: true, totalDeProductos: 0 }],
  ]);
  const clave = (nombre) => nombre.trim().toLowerCase();
  const repositorio = {
    listarFamilias: async () => [...familias.values()],
    buscarFamilia: async (nombre) => familias.get(clave(nombre)) ?? null,
    crearFamilia: async (familia) => familias.set(clave(familia.nombre), { ...familia, activa: true, totalDeProductos: 0 }),
    actualizarFamilia: async (nombre, cambios) => {
      const familia = { ...familias.get(clave(nombre)), ...cambios };
      familias.delete(clave(nombre));
      familias.set(clave(familia.nombre), familia);
    },
    eliminarFamilia: async (nombre) => familias.delete(clave(nombre)),
  };
  return new FamiliasService({ repositorio });
}

// La cabecera x-rol simula la sesión; sin ella no hay usuario.
async function levantarServidor(servicioDePrueba = servicio) {
  const aplicacion = express();
  aplicacion.use(express.json());
  aplicacion.use((peticion, _respuesta, siguiente) => {
    const rol = peticion.get("x-rol");
    peticion.usuario = rol ? { correo: "prueba@correo.test", rol } : null;
    siguiente();
  });
  aplicacion.use(
    "/api/catalogo",
    crearRutasDeCatalogo(new CatalogoController({ servicio: servicioDePrueba, familias: crearFamilias() }), {
      exigirRol: crearExigirRol({ publicar: async () => {} }),
    })
  );
  aplicacion.use(manejadorDeErrores);

  const servidor = aplicacion.listen(0);
  await new Promise((resolver) => servidor.once("listening", resolver));
  const url = `http://localhost:${servidor.address().port}/api/catalogo/productos`;
  const urlDelPanel = `http://localhost:${servidor.address().port}/api/catalogo/admin/productos`;
  const base = `http://localhost:${servidor.address().port}/api/catalogo`;
  return { url, urlDelPanel, base, cerrar: () => new Promise((resolver) => servidor.close(resolver)) };
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

test("tres campos faltantes responden 400 con los tres y el mensaje de cada uno", async (t) => {
  const { url, cerrar } = await levantarServidor({ ...servicio, crearProducto: async (datos) => validarProductoNuevo(datos) });
  t.after(cerrar);

  const { estado, cuerpo } = await registrar(url, { sku: "NUEVO-1" }, ROLES.ADMINISTRADOR);

  assert.equal(estado, 400);
  assert.deepEqual(cuerpo.error.detalles.campos, ["nombre", "categoria", "costoItem"]);
  assert.deepEqual(
    cuerpo.error.detalles.errores.map(({ campo }) => campo),
    ["nombre", "categoria", "costoItem"]
  );
  assert.equal(cuerpo.error.detalles.errores[0].mensaje, "El nombre es obligatorio.");
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
  assert.deepEqual(cuerpo.datos[0], { ...fun003, moneda: "USD", heredado: { importacion: true, margen: false } });
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

// Familias

async function pedir(url, { metodo = "GET", rol, cuerpo } = {}) {
  const respuesta = await fetch(url, {
    method: metodo,
    headers: { "content-type": "application/json", ...(rol ? { "x-rol": rol } : {}) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await respuesta.text();
  return { estado: respuesta.status, cuerpo: texto ? JSON.parse(texto) : null };
}

test("las familias de la tienda son públicas y /categorias sigue respondiendo lo mismo", async (t) => {
  const { base, cerrar } = await levantarServidor();
  t.after(cerrar);

  const familias = await pedir(`${base}/familias`);
  const categorias = await pedir(`${base}/categorias`);

  assert.equal(familias.estado, 200);
  assert.deepEqual(familias.cuerpo.datos, [{ nombre: "Legos", cantidadDeProductos: 3 }]);
  assert.deepEqual(categorias.cuerpo, familias.cuerpo);
});

test("el listado de familias del panel trae importación, margen y total de productos", async (t) => {
  const { base, cerrar } = await levantarServidor();
  t.after(cerrar);

  const { estado, cuerpo } = await pedir(`${base}/admin/familias`, { rol: ROLES.ADMINISTRADOR });

  assert.equal(estado, 200);
  assert.deepEqual(cuerpo.datos[0], {
    nombre: "Legos",
    descripcion: null,
    porcentajeImportacion: 15,
    margenGanancia: 18,
    activa: true,
    totalDeProductos: 2,
  });
});

test("crear, editar y eliminar familias exige sesión de administrador", async (t) => {
  const { base, cerrar } = await levantarServidor();
  t.after(cerrar);

  const operaciones = [
    { url: `${base}/admin/familias` },
    { url: `${base}/familias`, metodo: "POST", cuerpo: { nombre: "Peluches" } },
    { url: `${base}/familias/Legos`, metodo: "PATCH", cuerpo: { margenGanancia: 30 } },
    { url: `${base}/familias/Funkos`, metodo: "DELETE" },
  ];
  for (const operacion of operaciones) {
    assert.equal((await pedir(operacion.url, operacion)).estado, 401);
    assert.equal((await pedir(operacion.url, { ...operacion, rol: ROLES.CLIENTE })).estado, 403);
  }
});

test("crear una familia responde 201; repetida responde 409 y sin nombre 400", async (t) => {
  const { base, cerrar } = await levantarServidor();
  t.after(cerrar);
  const comoAdministrador = { metodo: "POST", rol: ROLES.ADMINISTRADOR };

  const creada = await pedir(`${base}/familias`, { ...comoAdministrador, cuerpo: { nombre: "Peluches", margenGanancia: 40 } });
  const repetida = await pedir(`${base}/familias`, { ...comoAdministrador, cuerpo: { nombre: " legos " } });
  const sinNombre = await pedir(`${base}/familias`, { ...comoAdministrador, cuerpo: { margenGanancia: -100 } });

  assert.equal(creada.estado, 201);
  assert.equal(creada.cuerpo.datos.margenGanancia, 40);
  assert.equal(repetida.estado, 409);
  assert.equal(sinNombre.estado, 400);
  assert.deepEqual(sinNombre.cuerpo.error.detalles.campos, ["nombre", "margenGanancia"]);
});

test("editar una familia responde con sus datos nuevos; una que no existe da 404", async (t) => {
  const { base, cerrar } = await levantarServidor();
  t.after(cerrar);
  const comoAdministrador = { metodo: "PATCH", rol: ROLES.ADMINISTRADOR };

  const editada = await pedir(`${base}/familias/Legos`, { ...comoAdministrador, cuerpo: { nombre: "LEGO", activa: false } });
  const noExiste = await pedir(`${base}/familias/Peluches`, { ...comoAdministrador, cuerpo: { activa: false } });

  assert.equal(editada.estado, 200);
  assert.equal(editada.cuerpo.datos.nombre, "LEGO");
  assert.equal(editada.cuerpo.datos.activa, false);
  assert.equal(noExiste.estado, 404);
});

test("eliminar una familia sin productos responde 204 y con productos 409", async (t) => {
  const { base, cerrar } = await levantarServidor();
  t.after(cerrar);
  const comoAdministrador = { metodo: "DELETE", rol: ROLES.ADMINISTRADOR };

  assert.equal((await pedir(`${base}/familias/Funkos`, comoAdministrador)).estado, 204);
  const conProductos = await pedir(`${base}/familias/Legos`, comoAdministrador);
  assert.equal(conProductos.estado, 409);
  assert.match(conProductos.cuerpo.error.mensaje, /tiene 2 productos/);
});
