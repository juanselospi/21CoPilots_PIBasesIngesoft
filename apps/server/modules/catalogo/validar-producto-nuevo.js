/**
 * Revisa y normaliza los datos de un producto nuevo que llegan del panel.
 */

import { crearValidacion, texto } from "../../shared/validacion/validar-campos.js";
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
  const validacion = crearValidacion();

  // El SKU se guarda en mayúsculas y sin espacios
  const sku = texto(datos.sku)?.toUpperCase() ?? null;
  if (!sku) validacion.anotar("sku", "El código es obligatorio.");
  else if (sku.length > LIMITES.sku) validacion.anotar("sku", `El código no puede pasar de ${LIMITES.sku} caracteres.`);

  const nombre = texto(datos.nombre);
  if (!nombre) validacion.anotar("nombre", "El nombre es obligatorio.");
  else if (nombre.length > LIMITES.nombre) {
    validacion.anotar("nombre", `El nombre no puede pasar de ${LIMITES.nombre} caracteres.`);
  }

  const categoria = texto(datos.categoria);
  if (!categoria) validacion.anotar("categoria", "La categoría es obligatoria.");
  else if (categoria.length > LIMITES.categoria) {
    validacion.anotar("categoria", `La categoría no puede pasar de ${LIMITES.categoria} caracteres.`);
  }

  const costoItem = numero(datos.costoItem);
  const problemaDeCosto = problemaDelCosto(costoItem);
  if (problemaDeCosto) validacion.anotar("costoItem", problemaDeCosto);

  // Al crear, importación y margen son opcionales y valen 0 si no vienen.
  const porcentajeImportacion = numero(datos.porcentajeImportacion) ?? 0;
  const problemaDeImportacion = problemaDeLaImportacion(porcentajeImportacion);
  if (problemaDeImportacion) validacion.anotar("porcentajeImportacion", problemaDeImportacion);

  const margenGanancia = numero(datos.margenGanancia) ?? 0;
  const problemaDeMargen = problemaDelMargen(margenGanancia);
  if (problemaDeMargen) validacion.anotar("margenGanancia", problemaDeMargen);

  // Si no se indican, el producto nace sin existencias.
  const existencias = numero(datos.existencias) ?? 0;
  const problemaDeExistencias = problemaDeLasExistencias(existencias);
  if (problemaDeExistencias) validacion.anotar("existencias", problemaDeExistencias);

  const admiteContrapedido = datos.admiteContrapedido ?? false;
  const problemaDeContrapedido = problemaDelContrapedido(admiteContrapedido);
  if (problemaDeContrapedido) validacion.anotar("admiteContrapedido", problemaDeContrapedido);

  const imagenUrl = texto(datos.imagenUrl);
  if (imagenUrl && (!esUrlWeb(imagenUrl) || imagenUrl.length > LIMITES.imagenUrl)) {
    validacion.anotar("imagenUrl", "La imagen tiene que ser una dirección web (http o https).");
  }

  const proveedor = texto(datos.proveedor);
  if (proveedor && proveedor.length > LIMITES.proveedor) {
    validacion.anotar("proveedor", `El proveedor no puede pasar de ${LIMITES.proveedor} caracteres.`);
  }

  validacion.lanzarSiHayProblemas();

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

function esUrlWeb(valor) {
  try {
    const { protocol } = new URL(valor);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
