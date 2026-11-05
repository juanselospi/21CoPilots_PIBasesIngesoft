/**
 * Revisa y normaliza la consulta del listado del panel (GET /admin/productos).
 */

import { crearValidacion } from "../../shared/validacion/validar-campos.js";
import { DISPONIBILIDAD, ORDENES_DE_ADMINISTRACION } from "./catalogo.service.js";
import { crearLectorDeConsulta } from "./leer-consulta.js";

const LIMITES_PERMITIDOS = Object.freeze([24, 48, 96]);
const LIMITE_POR_DEFECTO = 24;
const ORDEN_POR_DEFECTO = "nombre";

/**
 * @returns los filtros listos para el servicio, más `pagina` y `limite`
 * @throws {EntradaInvalida} con la lista de parámetros que tienen problemas
 */
export function validarConsultaAdministrativa(consulta = {}) {
  const validacion = crearValidacion();
  const { leer, leerBooleano, leerRangoDePrecio, leerOpcion, leerPagina, leerLimite } = crearLectorDeConsulta(
    consulta,
    validacion
  );

  const termino = leer("q");
  const categoria = leer("categoria");
  const proveedor = leer("proveedor");
  const disponibilidad = leerOpcion("disponibilidad", Object.values(DISPONIBILIDAD));
  const existenciasBajas = leerBooleano("existenciasBajas");
  const margenNegativo = leerBooleano("margenNegativo");
  const { precioMin, precioMax } = leerRangoDePrecio();
  const orden = leerOpcion("orden", Object.keys(ORDENES_DE_ADMINISTRACION), ORDEN_POR_DEFECTO);
  const limite = leerLimite({
    porDefecto: LIMITE_POR_DEFECTO,
    admite: (valor) => LIMITES_PERMITIDOS.includes(valor),
    mensaje: `"limite" tiene que ser ${LIMITES_PERMITIDOS.join(", ")}.`,
  });
  const pagina = leerPagina();

  validacion.lanzarSiHayProblemas();

  return {
    termino,
    categoria,
    proveedor,
    disponibilidad,
    existenciasBajas,
    margenNegativo,
    precioMin,
    precioMax,
    orden,
    limite,
    pagina,
  };
}
