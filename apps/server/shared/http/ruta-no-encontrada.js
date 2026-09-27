/**
 * Eslabón previo al manejador de errores: convierte cualquier ruta sin
 * atender en un error de dominio, para que la respuesta tenga el mismo
 * formato que todas las demás.
 */

import { RecursoNoEncontrado } from "../errores/errores-de-dominio.js";

export function rutaNoEncontrada(peticion, _respuesta, siguiente) {
  siguiente(new RecursoNoEncontrado("la ruta", `${peticion.method} ${peticion.originalUrl}`));
}
