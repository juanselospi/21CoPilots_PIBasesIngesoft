/**
 * Revisa y normaliza los datos de un producto nuevo que llegan del panel.
 *
 * Junta todos los problemas en un solo error, para que el formulario
 * pueda marcar todos los campos malos de una vez y no de uno en uno.
 * Los límites son los de las columnas de catalogo.producto.
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import { numero, problemaDelCosto, problemaDeLaImportacion, problemaDelMargen } from "./reglas-de-precio.js";
import { problemaDeLasExistencias, problemaDelContrapedido } from "./reglas-de-existencias.js";

const LIMITES = Object.freeze({
  sku: 50,
  nombre: 200,
  categoria: 100,
  proveedor: 150,
  imagenUrl: 500,
});

/**
 * @returns el producto listo para guardar
 * @throws {EntradaInvalida} con la lista de campos que tienen problemas
 */
export function validarProductoNuevo(datos = {}) {
  const problemas = [];
  const campos = [];
  const anotar = (campo, mensaje) => {
    campos.push(campo);
    problemas.push(mensaje);
  };

  // El SKU se guarda en mayúsculas y sin espacios, así "pkm-001 " y
  // "PKM-001" son el mismo código.
  const sku = texto(datos.sku)?.toUpperCase() ?? null;
  if (!sku) anotar("sku", "El código es obligatorio.");
  else if (sku.length > LIMITES.sku) anotar("sku", `El código no puede pasar de ${LIMITES.sku} caracteres.`);

  const nombre = texto(datos.nombre);
  if (!nombre) anotar("nombre", "El nombre es obligatorio.");
  else if (nombre.length > LIMITES.nombre) anotar("nombre", `El nombre no puede pasar de ${LIMITES.nombre} caracteres.`);

  const categoria = texto(datos.categoria);
  if (!categoria) anotar("categoria", "La categoría es obligatoria.");
  else if (categoria.length > LIMITES.categoria) anotar("categoria", `La categoría no puede pasar de ${LIMITES.categoria} caracteres.`);

  const costoItem = numero(datos.costoItem);
  const problemaDeCosto = problemaDelCosto(costoItem);
  if (problemaDeCosto) anotar("costoItem", problemaDeCosto);

  // Al crear, importación y margen son opcionales y valen 0 si no vienen.
  const porcentajeImportacion = numero(datos.porcentajeImportacion) ?? 0;
  const problemaDeImportacion = problemaDeLaImportacion(porcentajeImportacion);
  if (problemaDeImportacion) anotar("porcentajeImportacion", problemaDeImportacion);

  const margenGanancia = numero(datos.margenGanancia) ?? 0;
  const problemaDeMargen = problemaDelMargen(margenGanancia);
  if (problemaDeMargen) anotar("margenGanancia", problemaDeMargen);

  // Si no se indican, el producto nace sin existencias.
  const existencias = numero(datos.existencias) ?? 0;
  const problemaDeExistencias = problemaDeLasExistencias(existencias);
  if (problemaDeExistencias) anotar("existencias", problemaDeExistencias);

  const admiteContrapedido = datos.admiteContrapedido ?? false;
  const problemaDeContrapedido = problemaDelContrapedido(admiteContrapedido);
  if (problemaDeContrapedido) anotar("admiteContrapedido", problemaDeContrapedido);

  const imagenUrl = texto(datos.imagenUrl);
  if (imagenUrl && (!esUrlWeb(imagenUrl) || imagenUrl.length > LIMITES.imagenUrl)) {
    anotar("imagenUrl", "La imagen tiene que ser una dirección web (http o https).");
  }

  const proveedor = texto(datos.proveedor);
  if (proveedor && proveedor.length > LIMITES.proveedor) {
    anotar("proveedor", `El proveedor no puede pasar de ${LIMITES.proveedor} caracteres.`);
  }

  if (problemas.length > 0) {
    throw new EntradaInvalida(problemas.join(" "), campos);
  }

  return {
    sku,
    nombre,
    descripcion: texto(datos.descripcion),
    categoria,
    proveedor,
    imagenUrl,
    costoItem,
    porcentajeImportacion,
    margenGanancia,
    existencias,
    admiteContrapedido,
  };
}

/** Texto sin espacios en los extremos, o null si viene vacío. */
function texto(valor) {
  if (typeof valor !== "string") return null;
  return valor.trim() || null;
}

function esUrlWeb(valor) {
  try {
    const { protocol } = new URL(valor);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
