/**
 * Revisa y normaliza los datos de un producto nuevo que llegan del panel.
 *
 * Junta todos los problemas en un solo error, para que el formulario
 * pueda marcar todos los campos malos de una vez y no de uno en uno.
 * Los límites son los de las columnas de catalogo.producto.
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";

const LIMITES = Object.freeze({
  sku: 50,
  nombre: 200,
  categoria: 100,
  proveedor: 150,
  imagenUrl: 500,
  costo: 9_999_999_999.99, // NUMERIC(12,2)
  porcentaje: 9_999.99, //    NUMERIC(6,2)
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
  if (costoItem === null) anotar("costoItem", "El costo es obligatorio.");
  else if (Number.isNaN(costoItem)) anotar("costoItem", "El costo tiene que ser un número.");
  else if (costoItem < 0) anotar("costoItem", "El costo no puede ser negativo.");
  else if (costoItem > LIMITES.costo) anotar("costoItem", "El costo es demasiado grande.");

  const porcentajeImportacion = numero(datos.porcentajeImportacion) ?? 0;
  if (Number.isNaN(porcentajeImportacion) || porcentajeImportacion < 0 || porcentajeImportacion > LIMITES.porcentaje) {
    anotar("porcentajeImportacion", "El porcentaje de importación tiene que ser un número de 0 o más.");
  }

  // El margen puede ser negativo (liquidaciones), pero con -100 % el
  // producto quedaría gratis.
  const margenGanancia = numero(datos.margenGanancia) ?? 0;
  if (Number.isNaN(margenGanancia) || margenGanancia <= -100 || margenGanancia > LIMITES.porcentaje) {
    anotar("margenGanancia", "El margen tiene que ser un número mayor que -100 %.");
  }

  if (datos.admiteContrapedido !== undefined && typeof datos.admiteContrapedido !== "boolean") {
    anotar("admiteContrapedido", "Indique si el producto admite contrapedido.");
  }

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
    admiteContrapedido: datos.admiteContrapedido ?? false,
  };
}

/** Texto sin espacios en los extremos, o null si viene vacío. */
function texto(valor) {
  if (typeof valor !== "string") return null;
  return valor.trim() || null;
}

/**
 * Los formularios mandan los números como texto ("12.5"). Devuelve null
 * si no viene y NaN si viene algo que no es número.
 */
function numero(valor) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor === "number") return valor;
  if (typeof valor !== "string") return NaN;
  // Number("  ") da 0; un campo en blanco cuenta como que no vino.
  return valor.trim() === "" ? null : Number(valor);
}

function esUrlWeb(valor) {
  try {
    const { protocol } = new URL(valor);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
