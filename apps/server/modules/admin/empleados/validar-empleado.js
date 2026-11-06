/**
 * Revisa los datos de una cuenta de empleado nueva y del cambio de activo.
 */

import { crearValidacion, texto } from "../../../shared/validacion/validar-campos.js";
import { problemaDeLaContrasena } from "../seguridad/politica-de-contrasenas.js";

const LIMITES = Object.freeze({ nombre: 150, correo: 255 });
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @returns `{ nombre, correo, contrasena }` con el correo en minúsculas */
export function validarEmpleadoNuevo(datos = {}) {
  const validacion = crearValidacion();

  const nombre = texto(datos.nombre);
  if (!nombre) validacion.anotar("nombre", "El nombre es obligatorio.");
  else if (nombre.length > LIMITES.nombre) {
    validacion.anotar("nombre", `El nombre no puede pasar de ${LIMITES.nombre} caracteres.`);
  }

  const correo = texto(datos.correo)?.toLowerCase() ?? null;
  if (!correo) validacion.anotar("correo", "El correo es obligatorio.");
  else if (!CORREO.test(correo) || correo.length > LIMITES.correo) {
    validacion.anotar("correo", "El correo no es válido.");
  }

  // La contraseña no se recorta: un espacio también cuenta como carácter
  const contrasena = typeof datos.contrasena === "string" ? datos.contrasena : "";
  if (!contrasena) validacion.anotar("contrasena", "La contraseña es obligatoria.");
  else {
    const problema = problemaDeLaContrasena(contrasena);
    if (problema) validacion.anotar("contrasena", problema);
  }

  validacion.lanzarSiHayProblemas();
  return { nombre, correo, contrasena };
}

/** @returns true o false */
export function validarActivo(datos = {}) {
  const validacion = crearValidacion();
  if (typeof datos.activo !== "boolean") validacion.anotar("activo", "Indique si la cuenta queda activa (true o false).");
  validacion.lanzarSiHayProblemas();
  return datos.activo;
}
