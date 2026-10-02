/**
 * Revisa y normaliza la consulta del listado del panel
 * (GET /admin/productos). Todos los parámetros son opcionales.
 *
 * Como en validar-producto-nuevo.js, junta todos los problemas en un
 * solo error, para que el panel pueda marcar todos los filtros malos de
 * una vez.
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import { DISPONIBILIDAD, ORDENES_DE_ADMINISTRACION } from "./catalogo.service.js";

const LIMITES_PERMITIDOS = Object.freeze([24, 48, 96]);
const LIMITE_POR_DEFECTO = 24;
const ORDEN_POR_DEFECTO = "nombre";

const ENTERO_SIN_SIGNO = /^\d+$/;
const NUMERO_SIN_SIGNO = /^\d+(\.\d+)?$/;

/**
 * @returns los filtros listos para el servicio, más `pagina` y `limite`
 * @throws {EntradaInvalida} con la lista de parámetros que tienen problemas
 */
export function validarConsultaAdministrativa(consulta = {}) {
  const problemas = [];
  const campos = [];
  const anotar = (campo, mensaje) => {
    campos.push(campo);
    problemas.push(mensaje);
  };

  // Un parámetro vacío cuenta como que no vino. Si viene repetido
  // (?q=a&q=b), Express lo entrega como lista y no se adivina cuál vale.
  const leer = (campo) => {
    const valor = consulta[campo];
    if (valor === undefined) return null;
    if (typeof valor !== "string") {
      anotar(campo, `"${campo}" solo puede venir una vez.`);
      return null;
    }
    return valor.trim() || null;
  };

  const leerBooleano = (campo) => {
    const valor = leer(campo);
    if (valor === null) return false;
    if (valor !== "true" && valor !== "false") anotar(campo, `"${campo}" tiene que ser true o false.`);
    return valor === "true";
  };

  const leerPrecio = (campo) => {
    const valor = leer(campo);
    if (valor === null) return null;
    if (!NUMERO_SIN_SIGNO.test(valor)) {
      anotar(campo, `"${campo}" tiene que ser un número de 0 o más.`);
      return null;
    }
    return Number(valor);
  };

  const termino = leer("q");
  const categoria = leer("categoria");
  const proveedor = leer("proveedor");

  const disponibilidad = leer("disponibilidad");
  if (disponibilidad !== null && !Object.values(DISPONIBILIDAD).includes(disponibilidad)) {
    anotar("disponibilidad", `"disponibilidad" tiene que ser uno de: ${Object.values(DISPONIBILIDAD).join(", ")}.`);
  }

  const existenciasBajas = leerBooleano("existenciasBajas");
  const margenNegativo = leerBooleano("margenNegativo");

  const precioMin = leerPrecio("precioMin");
  const precioMax = leerPrecio("precioMax");
  if (precioMin !== null && precioMax !== null && precioMin > precioMax) {
    campos.push("precioMin", "precioMax");
    problemas.push('"precioMin" no puede ser mayor que "precioMax".');
  }

  const orden = leer("orden") ?? ORDEN_POR_DEFECTO;
  if (!Object.hasOwn(ORDENES_DE_ADMINISTRACION, orden)) {
    anotar("orden", `"orden" tiene que ser uno de: ${Object.keys(ORDENES_DE_ADMINISTRACION).join(", ")}.`);
  }

  const limiteTexto = leer("limite");
  const limite = limiteTexto === null ? LIMITE_POR_DEFECTO : Number(limiteTexto);
  if (limiteTexto !== null && !(ENTERO_SIN_SIGNO.test(limiteTexto) && LIMITES_PERMITIDOS.includes(limite))) {
    anotar("limite", `"limite" tiene que ser ${LIMITES_PERMITIDOS.join(", ")}.`);
  }

  const paginaTexto = leer("pagina");
  const pagina = paginaTexto === null ? 0 : Number(paginaTexto);
  if (paginaTexto !== null && !(ENTERO_SIN_SIGNO.test(paginaTexto) && Number.isSafeInteger(pagina))) {
    anotar("pagina", '"pagina" tiene que ser un entero de 0 o más.');
  }

  if (problemas.length > 0) {
    throw new EntradaInvalida(problemas.join(" "), campos);
  }

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
