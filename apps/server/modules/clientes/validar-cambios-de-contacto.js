/**
 * Revisa lo que el cliente cambia desde "Mi cuenta": su dirección y sus
 * teléfonos. La cédula no se cambia aquí; la corrige el administrador.
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import { crearValidacion, texto } from "../../shared/validacion/validar-campos.js";
import { normalizarTelefono, problemaDelTelefono, problemaDeLaDireccion } from "./reglas-de-contacto.js";

const CAMPOS_EDITABLES = Object.freeze(["direccion", "telefonos"]);
const MAXIMO_DE_TELEFONOS = 5;

/**
 * @returns solo lo que vino: la dirección limpia y los teléfonos como 8888-8888, sin repetidos
 * @throws {EntradaInvalida} con todos los campos que tienen problemas
 */
export function validarCambiosDeContacto(datos) {
  if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
    throw new EntradaInvalida("Mande un objeto con direccion o telefonos.");
  }

  const validacion = crearValidacion();
  const vino = (campo) => Object.hasOwn(datos, campo);

  const sobrantes = Object.keys(datos).filter((clave) => !CAMPOS_EDITABLES.includes(clave));
  if (sobrantes.length > 0) {
    const mensaje = `Desde Mi cuenta solo se cambian la dirección y los teléfonos; no: ${sobrantes.join(", ")}.`;
    validacion.anotar(sobrantes, mensaje);
  }
  // Si mandó algo que no se puede cambiar, basta con decirle eso
  if (sobrantes.length === 0 && !CAMPOS_EDITABLES.some(vino)) {
    validacion.anotar(CAMPOS_EDITABLES, "Indique la dirección o los teléfonos.");
  }

  const cambios = {};
  if (vino("direccion")) {
    cambios.direccion = texto(datos.direccion);
    const problema = problemaDeLaDireccion(cambios.direccion);
    if (problema) validacion.anotar("direccion", problema);
  }

  if (vino("telefonos")) {
    const telefonos = datos.telefonos;
    if (!Array.isArray(telefonos) || telefonos.length === 0) {
      validacion.anotar("telefonos", "Indique al menos un teléfono.");
    } else if (telefonos.length > MAXIMO_DE_TELEFONOS) {
      validacion.anotar("telefonos", `Se pueden guardar hasta ${MAXIMO_DE_TELEFONOS} teléfonos.`);
    } else {
      const problema = telefonos.map(problemaDelTelefono).find(Boolean);
      if (problema) validacion.anotar("telefonos", problema);
      else cambios.telefonos = [...new Set(telefonos.map(normalizarTelefono))];
    }
  }

  validacion.lanzarSiHayProblemas();
  return cambios;
}
