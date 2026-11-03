/**
 * Revisa y normaliza los cambios de un producto que llegan del modal
 * "Editar producto"
 *
 * Importación y margen aceptan null, que significa volver a usar los de la
 * familia. Descripción, proveedor e imagen vacíos se borran.
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import { crearValidacion, texto } from "../../shared/validacion/validar-campos.js";
import { numero, problemaDelCosto, problemaDeLaImportacion, problemaDelMargen } from "./reglas-de-precio.js";
import { problemaDeLasExistencias, problemaDelContrapedido } from "./reglas-de-existencias.js";
import {
  problemaDelNombre,
  problemaDeLaCategoria,
  problemaDelProveedor,
  problemaDeLaImagen,
} from "./reglas-de-datos-generales.js";

// El contrapedido llega como true o false, no como texto
const sinConvertir = (valor) => valor ?? null;

// siVieneVacio: null quiere decir que vacío es válido y borra el valor
const CAMPOS = Object.freeze({
  nombre: { leer: texto, siVieneVacio: "El nombre es obligatorio.", problemaCon: problemaDelNombre },
  descripcion: { leer: texto, siVieneVacio: null },
  categoria: { leer: texto, siVieneVacio: "La categoría es obligatoria.", problemaCon: problemaDeLaCategoria },
  proveedor: { leer: texto, siVieneVacio: null, problemaCon: problemaDelProveedor },
  imagenUrl: { leer: texto, siVieneVacio: null, problemaCon: problemaDeLaImagen },
  costoItem: { leer: numero, siVieneVacio: "El costo es obligatorio.", problemaCon: problemaDelCosto },
  porcentajeImportacion: {
    leer: numero,
    siVieneVacio: "El porcentaje de importación es obligatorio.",
    problemaCon: problemaDeLaImportacion,
    heredable: true,
  },
  margenGanancia: {
    leer: numero,
    siVieneVacio: "El margen es obligatorio.",
    problemaCon: problemaDelMargen,
    heredable: true,
  },
  existencias: { leer: numero, siVieneVacio: "Las existencias son obligatorias.", problemaCon: problemaDeLasExistencias },
  admiteContrapedido: {
    leer: sinConvertir,
    siVieneVacio: "Indique si el producto admite contrapedido.",
    problemaCon: problemaDelContrapedido,
  },
});
const NOMBRES_DE_CAMPOS = Object.keys(CAMPOS);

/**
 * @returns solo los campos que vinieron, ya convertidos
 * @throws {EntradaInvalida} con la lista de campos que tienen problemas
 */
export function validarCambiosDeProducto(datos) {
  if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
    throw new EntradaInvalida(`Mande un objeto con ${NOMBRES_DE_CAMPOS.join(", ")}.`);
  }

  const validacion = crearValidacion();

  const sobrantes = Object.keys(datos).filter((clave) => !Object.hasOwn(CAMPOS, clave));
  if (sobrantes.length > 0) {
    validacion.anotar(
      sobrantes,
      `Solo se pueden cambiar ${NOMBRES_DE_CAMPOS.join(", ")}; no se aceptan: ${sobrantes.join(", ")}.`
    );
  }

  if (!NOMBRES_DE_CAMPOS.some((campo) => Object.hasOwn(datos, campo))) {
    validacion.anotar(NOMBRES_DE_CAMPOS, `Indique al menos uno de: ${NOMBRES_DE_CAMPOS.join(", ")}.`);
  }

  const cambios = {};
  for (const [campo, { leer, siVieneVacio, problemaCon, heredable }] of Object.entries(CAMPOS)) {
    if (!Object.hasOwn(datos, campo)) continue;

    // Un null explícito es pedir la de la familia; un texto vacío sigue siendo un error
    if (heredable && datos[campo] === null) {
      cambios[campo] = null;
      continue;
    }

    const valor = leer(datos[campo]);
    if (valor === null) {
      if (siVieneVacio) validacion.anotar(campo, siVieneVacio);
      else cambios[campo] = null;
      continue;
    }

    const problema = problemaCon?.(valor);
    if (problema) validacion.anotar(campo, problema);
    else cambios[campo] = valor;
  }

  validacion.lanzarSiHayProblemas();
  return cambios;
}
