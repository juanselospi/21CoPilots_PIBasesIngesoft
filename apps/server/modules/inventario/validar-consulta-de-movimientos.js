/**
 * Revisa los filtros de GET /movimientos.
 */

import { crearValidacion, texto } from "../../shared/validacion/validar-campos.js";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const LIMITES_PERMITIDOS = Object.freeze([25, 50, 100]);
const UN_DIA = 24 * 60 * 60 * 1000;

/** @returns los filtros; `hasta` incluye todo ese día */
export function validarConsultaDeMovimientos(consulta = {}) {
  const validacion = crearValidacion();
  const leer = (campo) => (typeof consulta[campo] === "string" ? texto(consulta[campo]) : null);

  const leerFecha = (campo) => {
    const valor = leer(campo);
    if (valor === null) return null;
    const fecha = new Date(`${valor}T00:00:00`);
    if (FECHA.test(valor) && !Number.isNaN(fecha.getTime())) return fecha;
    validacion.anotar(campo, `"${campo}" tiene que ser una fecha como 2026-11-03.`);
    return null;
  };

  const desde = leerFecha("desde");
  const hastaElDia = leerFecha("hasta");
  const hasta = hastaElDia && new Date(hastaElDia.getTime() + UN_DIA);

  const limiteTexto = leer("limite");
  const limite = limiteTexto === null ? 50 : Number(limiteTexto);
  if (limiteTexto !== null && !LIMITES_PERMITIDOS.includes(limite)) {
    validacion.anotar("limite", `"limite" tiene que ser ${LIMITES_PERMITIDOS.join(", ")}.`);
  }

  const paginaTexto = leer("pagina");
  const pagina = paginaTexto === null ? 0 : Number(paginaTexto);
  if (paginaTexto !== null && !(/^\d+$/.test(paginaTexto) && Number.isSafeInteger(pagina))) {
    validacion.anotar("pagina", '"pagina" tiene que ser un entero de 0 o más.');
  }

  validacion.lanzarSiHayProblemas();
  return { sku: leer("sku")?.toUpperCase() ?? null, tipo: leer("tipo"), desde, hasta, limite, pagina };
}
