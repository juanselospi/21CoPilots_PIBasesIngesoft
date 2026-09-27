/**
 * Punto de arranque del proceso.
 *
 * Responsabilidad única: levantar el servidor HTTP y apagarlo con orden.
 * Toda la construcción del sistema ocurre en `composicion.js`, así que
 * las pruebas pueden armar la aplicación sin abrir un puerto.
 */

import { crearAplicacion } from "./app.js";
import { componerSistema } from "./composicion.js";
import { configuracion } from "./configuracion.js";

const sistema = componerSistema(configuracion);
const aplicacion = crearAplicacion(sistema);

const servidor = aplicacion.listen(configuracion.puerto, () => {
  console.log(`API escuchando en http://localhost:${configuracion.puerto}`);
});

const apagar = async (senal) => {
  console.log(`\n${senal} recibida, cerrando...`);
  servidor.close();
  await sistema.cerrar();
  process.exit(0);
};

process.on("SIGINT", () => apagar("SIGINT"));
process.on("SIGTERM", () => apagar("SIGTERM"));
