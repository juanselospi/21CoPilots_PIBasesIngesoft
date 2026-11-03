/**
 * Revisa y normaliza los datos de la pestaña "Crear cuenta".
 *
 * Los formatos son los mismos que revisa el formulario (utils/reglasCliente.js
 * del cliente); aquí se vuelven a revisar porque la API se puede llamar sin él.
 */

import { crearValidacion, texto } from "../../shared/validacion/validar-campos.js";
import { problemaDeLaContrasena } from "../admin/seguridad/politica-de-contrasenas.js";

const LIMITES = Object.freeze({ nombre: 150, correo: 255, direccion: 500 });

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 8 dígitos de Costa Rica, con o sin guion o espacio en medio
const TELEFONO = /^(\d{4})[- ]?(\d{4})$/;
// De 9 a 12 dígitos con o sin guiones: física, jurídica y DIMEX
const CEDULA = /^(?=(?:\D*\d){9,12}\D*$)\d[\d-]*\d$/;

/**
 * @returns los datos listos para guardar: correo en minúsculas, cédula solo
 *   con dígitos y teléfono como 8888-8888
 * @throws {EntradaInvalida} con todos los campos que tienen problemas
 */
export function validarRegistro(datos = {}) {
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

  const cedulaEscrita = texto(datos.cedula);
  if (!cedulaEscrita) validacion.anotar("cedula", "La cédula es obligatoria.");
  else if (!CEDULA.test(cedulaEscrita)) validacion.anotar("cedula", "La cédula tiene que tener de 9 a 12 dígitos.");

  const telefonoEscrito = texto(datos.telefono);
  const partesDelTelefono = telefonoEscrito?.match(TELEFONO);
  if (!telefonoEscrito) validacion.anotar("telefono", "El teléfono es obligatorio.");
  else if (!partesDelTelefono) {
    validacion.anotar("telefono", "El teléfono tiene que tener 8 dígitos, por ejemplo 8888-8888.");
  }

  const direccion = texto(datos.direccion);
  if (!direccion) validacion.anotar("direccion", "La dirección es obligatoria.");
  else if (direccion.length > LIMITES.direccion) {
    validacion.anotar("direccion", `La dirección no puede pasar de ${LIMITES.direccion} caracteres.`);
  }

  // RF-38: sin aceptar los términos no se crea la cuenta
  if (datos.aceptaTerminos !== true) {
    validacion.anotar("aceptaTerminos", "Para crear la cuenta tiene que aceptar los términos y condiciones.");
  }

  validacion.lanzarSiHayProblemas();

  return {
    nombre,
    correo,
    contrasena,
    // Una sola forma de guardarla, así 1-1111-1111 y 111111111 son la misma
    cedula: cedulaEscrita.replace(/-/g, ""),
    telefono: `${partesDelTelefono[1]}-${partesDelTelefono[2]}`,
    direccion,
  };
}
