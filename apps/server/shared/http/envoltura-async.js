/**
 * Envuelve un controlador asíncrono para que un `throw` llegue al
 * manejador de errores sin repetir try/catch en cada ruta.
 */

export const asincrono = (controlador) => (peticion, respuesta, siguiente) =>
  Promise.resolve(controlador(peticion, respuesta, siguiente)).catch(siguiente);
