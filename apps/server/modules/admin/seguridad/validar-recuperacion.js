/**
 * Revisa el correo con el que se pide el enlace para recuperar la contraseña.
 */

import { crearValidacion, texto } from "../../../shared/validacion/validar-campos.js";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @returns el correo en minúsculas */
export function validarCorreoDeRecuperacion(datos = {}) {
  const validacion = crearValidacion();
  const correo = texto(datos?.correo)?.toLowerCase() ?? null;

  if (!correo) validacion.anotar("correo", "Indique el correo de su cuenta.");
  else if (!CORREO.test(correo)) validacion.anotar("correo", "El correo no es válido.");

  validacion.lanzarSiHayProblemas();
  return correo;
}
