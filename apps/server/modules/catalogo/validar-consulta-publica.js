/**
 * Revisa y normaliza la consulta del catálogo de la tienda (GET /productos).
 * Solo admite lo que el visitante puede pedir: nada de estados administrativos.
 */

import { crearValidacion } from "../../shared/validacion/validar-campos.js";
import { DISPONIBILIDAD, ORDENES_DE_TIENDA } from "./catalogo.service.js";
import { crearLectorDeConsulta } from "./leer-consulta.js";

// El visitante solo ve productos en existencia o por contrapedido
const DISPONIBILIDADES_PUBLICAS = Object.freeze([DISPONIBILIDAD.EN_EXISTENCIA, DISPONIBILIDAD.POR_CONTRAPEDIDO]);
const LIMITE_POR_DEFECTO = 24;
const LIMITE_MAXIMO = 48;
const ORDEN_POR_DEFECTO = "nombre";

/**
 * @returns los filtros listos para el servicio, más `pagina` y `limite`
 * @throws {EntradaInvalida} con la lista de parámetros que tienen problemas
 */
export function validarConsultaPublica(consulta = {}) {
  const validacion = crearValidacion();
  const { leer, leerRangoDePrecio, leerOpcion, leerPagina, leerLimite } = crearLectorDeConsulta(consulta, validacion);

  const termino = leer("q");
  const categoria = leer("categoria");
  const disponibilidad = leerOpcion("disponibilidad", DISPONIBILIDADES_PUBLICAS);
  const { precioMin, precioMax } = leerRangoDePrecio();
  const orden = leerOpcion("orden", Object.keys(ORDENES_DE_TIENDA), ORDEN_POR_DEFECTO);
  const limite = leerLimite({
    porDefecto: LIMITE_POR_DEFECTO,
    admite: (valor) => valor >= 1 && valor <= LIMITE_MAXIMO,
    mensaje: `"limite" tiene que ser un entero entre 1 y ${LIMITE_MAXIMO}.`,
  });
  const pagina = leerPagina();

  validacion.lanzarSiHayProblemas();

  return { termino, categoria, disponibilidad, precioMin, precioMax, orden, limite, pagina };
}
