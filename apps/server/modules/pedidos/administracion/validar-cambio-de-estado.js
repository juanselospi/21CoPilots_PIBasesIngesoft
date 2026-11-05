/**
 * Revisa el cuerpo de POST /admin/:correo/:numCarrito/estado.
 */

import { crearValidacion, texto } from "../../../shared/validacion/validar-campos.js";
import { ESTADOS } from "../estados/maquina-de-estados.js";

/** @returns el estado nuevo, en minúsculas */
export function validarCambioDeEstado(datos = {}) {
  const validacion = crearValidacion();
  const estado = texto(datos?.estado)?.toLowerCase() ?? null;

  if (estado === null) validacion.anotar("estado", "Indique el estado nuevo del pedido.");
  else if (!Object.values(ESTADOS).includes(estado)) {
    validacion.anotar("estado", `El estado tiene que ser uno de: ${Object.values(ESTADOS).join(", ")}.`);
  }

  validacion.lanzarSiHayProblemas();
  return estado;
}
