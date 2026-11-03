/**
 * Revisa y normaliza los cambios de un producto que llegan del modal
 * "Editar producto"
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import { crearValidacion } from "../../shared/validacion/validar-campos.js";
import { numero, problemaDelCosto, problemaDeLaImportacion, problemaDelMargen } from "./reglas-de-precio.js";
import { problemaDeLasExistencias, problemaDelContrapedido } from "./reglas-de-existencias.js";

// El contrapedido llega como true o false, no como texto
const sinConvertir = (valor) => valor ?? null;

const CAMPOS = Object.freeze({
  costoItem: { leer: numero, siVieneVacio: "El costo es obligatorio.", problemaCon: problemaDelCosto },
  porcentajeImportacion: {
    leer: numero,
    siVieneVacio: "El porcentaje de importación es obligatorio.",
    problemaCon: problemaDeLaImportacion,
  },
  margenGanancia: { leer: numero, siVieneVacio: "El margen es obligatorio.", problemaCon: problemaDelMargen },
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
  for (const [campo, { leer, siVieneVacio, problemaCon }] of Object.entries(CAMPOS)) {
    if (!Object.hasOwn(datos, campo)) continue;

    const valor = leer(datos[campo]);
    const problema = valor === null ? siVieneVacio : problemaCon(valor);
    if (problema) validacion.anotar(campo, problema);
    else cambios[campo] = valor;
  }

  validacion.lanzarSiHayProblemas();

  return cambios;
}
