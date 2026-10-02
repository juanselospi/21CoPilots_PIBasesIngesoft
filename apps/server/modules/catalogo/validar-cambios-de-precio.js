/**
 * Revisa y normaliza los cambios de precio de un producto que llegan del
 * modal "Editar precio" del panel.
 *
 * Es una actualización parcial: se puede mandar uno, dos o los tres
 * campos, y lo que no venga se queda como está. Un campo que viene vacío
 * es un error, no "dejarlo igual": para no cambiarlo, no se manda.
 *
 * Cualquier otra clave se rechaza. Los precios derivados (costo total,
 * precio sin impuesto, precio final) los calcula el motor de precios, y
 * los demás datos del producto no se editan aquí.
 *
 * Usa las mismas reglas que el registro (reglas-de-precio.js) y, como
 * validar-producto-nuevo.js, junta todos los problemas en un solo error.
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import { numero, problemaDelCosto, problemaDeLaImportacion, problemaDelMargen } from "./reglas-de-precio.js";

const CAMPOS = Object.freeze({
  costoItem: { siVieneVacio: "El costo es obligatorio.", problemaCon: problemaDelCosto },
  porcentajeImportacion: { siVieneVacio: "El porcentaje de importación es obligatorio.", problemaCon: problemaDeLaImportacion },
  margenGanancia: { siVieneVacio: "El margen es obligatorio.", problemaCon: problemaDelMargen },
});
const NOMBRES_DE_CAMPOS = Object.keys(CAMPOS);

/**
 * @returns solo los campos que vinieron, ya convertidos a número
 * @throws {EntradaInvalida} con la lista de campos que tienen problemas
 */
export function validarCambiosDePrecio(datos) {
  if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
    throw new EntradaInvalida(`Mande un objeto con ${NOMBRES_DE_CAMPOS.join(", ")}.`);
  }

  const problemas = [];
  const campos = [];
  const anotar = (campo, mensaje) => {
    campos.push(campo);
    problemas.push(mensaje);
  };

  const sobrantes = Object.keys(datos).filter((clave) => !Object.hasOwn(CAMPOS, clave));
  if (sobrantes.length > 0) {
    campos.push(...sobrantes);
    problemas.push(`Solo se pueden cambiar ${NOMBRES_DE_CAMPOS.join(", ")}; no se aceptan: ${sobrantes.join(", ")}.`);
  }

  if (!NOMBRES_DE_CAMPOS.some((campo) => Object.hasOwn(datos, campo))) {
    campos.push(...NOMBRES_DE_CAMPOS);
    problemas.push(`Indique al menos uno de: ${NOMBRES_DE_CAMPOS.join(", ")}.`);
  }

  const cambios = {};
  for (const [campo, { siVieneVacio, problemaCon }] of Object.entries(CAMPOS)) {
    if (!Object.hasOwn(datos, campo)) continue;

    const valor = numero(datos[campo]);
    const problema = valor === null ? siVieneVacio : problemaCon(valor);
    if (problema) anotar(campo, problema);
    else cambios[campo] = valor;
  }

  if (problemas.length > 0) {
    throw new EntradaInvalida(problemas.join(" "), campos);
  }

  return cambios;
}
