/**
 * Revisa y normaliza los datos de un producto nuevo que llegan del panel.
 */

import { crearValidacion, texto } from "../../shared/validacion/validar-campos.js";
import { numero, problemaDelCosto, problemaDeLaImportacion, problemaDelMargen } from "./reglas-de-precio.js";
import { problemaDeLasExistencias, problemaDelContrapedido } from "./reglas-de-existencias.js";
import {
  LIMITES_DE_TEXTO as LIMITES,
  problemaDelNombre,
  problemaDeLaCategoria,
  problemaDelProveedor,
  problemaDeLaImagen,
} from "./reglas-de-datos-generales.js";

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
  const problemaDeNombre = problemaDelNombre(nombre);
  if (problemaDeNombre) validacion.anotar("nombre", problemaDeNombre);

  const categoria = texto(datos.categoria);
  const problemaDeCategoria = problemaDeLaCategoria(categoria);
  if (problemaDeCategoria) validacion.anotar("categoria", problemaDeCategoria);

  const costoItem = numero(datos.costoItem);
  const problemaDeCosto = problemaDelCosto(costoItem);
  if (problemaDeCosto) validacion.anotar("costoItem", problemaDeCosto);

  // Si no vienen, el producto usa la importación y el margen de su familia (null).
  const porcentajeImportacion = numero(datos.porcentajeImportacion);
  const problemaDeImportacion = porcentajeImportacion !== null && problemaDeLaImportacion(porcentajeImportacion);
  if (problemaDeImportacion) validacion.anotar("porcentajeImportacion", problemaDeImportacion);

  const margenGanancia = numero(datos.margenGanancia);
  const problemaDeMargen = margenGanancia !== null && problemaDelMargen(margenGanancia);
  if (problemaDeMargen) validacion.anotar("margenGanancia", problemaDeMargen);

  // Si no se indican, el producto nace sin existencias.
  const existencias = numero(datos.existencias) ?? 0;
  const problemaDeExistencias = problemaDeLasExistencias(existencias);
  if (problemaDeExistencias) validacion.anotar("existencias", problemaDeExistencias);

  const admiteContrapedido = datos.admiteContrapedido ?? false;
  const problemaDeContrapedido = problemaDelContrapedido(admiteContrapedido);
  if (problemaDeContrapedido) validacion.anotar("admiteContrapedido", problemaDeContrapedido);

  const imagenUrl = texto(datos.imagenUrl);
  const problemaDeImagen = problemaDeLaImagen(imagenUrl);
  if (problemaDeImagen) validacion.anotar("imagenUrl", problemaDeImagen);

  const proveedor = texto(datos.proveedor);
  const problemaDeProveedor = problemaDelProveedor(proveedor);
  if (problemaDeProveedor) validacion.anotar("proveedor", problemaDeProveedor);

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
