/**
 * Revisa y normaliza los datos de una familia que llegan del panel.
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import { crearValidacion, texto } from "../../shared/validacion/validar-campos.js";
import { numero, problemaDeLaImportacion, problemaDelMargen } from "./reglas-de-precio.js";

const LIMITE_DEL_NOMBRE = 100;
const CAMPOS_EDITABLES = Object.freeze(["nombre", "descripcion", "porcentajeImportacion", "margenGanancia", "activa"]);

/** Sin espacios en los extremos y con uno solo entre palabras. */
export const normalizarNombreDeFamilia = (nombre) => nombre.trim().replace(/\s+/g, " ");

/**
 * Importación y margen son opcionales al crear y valen 0.
 * @throws {EntradaInvalida} con todos los campos que tienen problemas
 */
export function validarFamiliaNueva(datos = {}) {
  const validacion = crearValidacion();

  const nombre = leerNombre(datos.nombre, validacion);
  const porcentajeImportacion = leerPorcentaje(datos.porcentajeImportacion, "porcentajeImportacion", validacion, 0);
  const margenGanancia = leerPorcentaje(datos.margenGanancia, "margenGanancia", validacion, 0);

  validacion.lanzarSiHayProblemas();
  return { nombre, descripcion: texto(datos.descripcion), porcentajeImportacion, margenGanancia };
}

/**
 * @returns solo los campos que vinieron, ya convertidos
 * @throws {EntradaInvalida} con todos los campos que tienen problemas
 */
export function validarCambiosDeFamilia(datos) {
  if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
    throw new EntradaInvalida(`Mande un objeto con ${CAMPOS_EDITABLES.join(", ")}.`);
  }

  const validacion = crearValidacion();
  const vino = (campo) => Object.hasOwn(datos, campo);

  const sobrantes = Object.keys(datos).filter((clave) => !CAMPOS_EDITABLES.includes(clave));
  if (sobrantes.length > 0) {
    validacion.anotar(
      sobrantes,
      `Solo se pueden cambiar ${CAMPOS_EDITABLES.join(", ")}; no se aceptan: ${sobrantes.join(", ")}.`
    );
  }
  if (!CAMPOS_EDITABLES.some(vino)) {
    validacion.anotar(CAMPOS_EDITABLES, `Indique al menos uno de: ${CAMPOS_EDITABLES.join(", ")}.`);
  }

  const cambios = {};
  if (vino("nombre")) cambios.nombre = leerNombre(datos.nombre, validacion);
  // Una descripción vacía la borra
  if (vino("descripcion")) cambios.descripcion = texto(datos.descripcion);
  for (const campo of ["porcentajeImportacion", "margenGanancia"]) {
    if (vino(campo)) cambios[campo] = leerPorcentaje(datos[campo], campo, validacion);
  }
  if (vino("activa")) {
    if (typeof datos.activa !== "boolean") validacion.anotar("activa", "Indique si la familia está activa (true o false).");
    cambios.activa = datos.activa;
  }

  validacion.lanzarSiHayProblemas();
  return cambios;
}

function leerNombre(valor, validacion) {
  const nombre = texto(valor) && normalizarNombreDeFamilia(valor);
  if (!nombre) validacion.anotar("nombre", "El nombre de la familia es obligatorio.");
  else if (nombre.length > LIMITE_DEL_NOMBRE) {
    validacion.anotar("nombre", `El nombre no puede pasar de ${LIMITE_DEL_NOMBRE} caracteres.`);
  }
  return nombre;
}

// Al editar no hay valor por defecto: mandar el campo vacío es un error
function leerPorcentaje(valor, campo, validacion, porDefecto = null) {
  const porcentaje = numero(valor) ?? porDefecto;
  const problema =
    porcentaje === null
      ? "Indique un porcentaje."
      : campo === "margenGanancia"
        ? problemaDelMargen(porcentaje)
        : problemaDeLaImportacion(porcentaje);
  if (problema) validacion.anotar(campo, problema);
  return porcentaje;
}
