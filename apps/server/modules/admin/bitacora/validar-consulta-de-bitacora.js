/**
 * Revisa los filtros de GET /api/admin/bitacora.
 */

import { crearValidacion, texto } from "../../../shared/validacion/validar-campos.js";

const LIMITES_PERMITIDOS = Object.freeze([25, 50, 100]);
const LIMITE_POR_DEFECTO = 50;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ENTERO_SIN_SIGNO = /^\d+$/;

/**
 * @returns los filtros listos para el repositorio; `hasta` incluye todo ese día
 * @throws {EntradaInvalida} con todos los parámetros que tienen problemas
 */
export function validarConsultaDeBitacora(consulta = {}) {
  const validacion = crearValidacion();
  const leer = (campo) => (typeof consulta[campo] === "string" ? texto(consulta[campo]) : null);

  const leerFecha = (campo) => {
    const valor = leer(campo);
    if (valor === null) return null;
    const fecha = new Date(`${valor}T00:00:00`);
    if (!FECHA.test(valor) || Number.isNaN(fecha.getTime())) {
      validacion.anotar(campo, `"${campo}" tiene que ser una fecha como 2026-11-03.`);
      return null;
    }
    return fecha;
  };

  const desde = leerFecha("desde");
  const hastaElDia = leerFecha("hasta");
  // Para incluir todo el día de "hasta" se busca hasta el inicio del día siguiente
  const hasta = hastaElDia && new Date(hastaElDia.getTime() + 24 * 60 * 60 * 1000);
  if (desde && hasta && desde >= hasta) {
    validacion.anotar(["desde", "hasta"], '"desde" no puede ser después de "hasta".');
  }

  const limiteTexto = leer("limite");
  const limite = limiteTexto === null ? LIMITE_POR_DEFECTO : Number(limiteTexto);
  if (limiteTexto !== null && !LIMITES_PERMITIDOS.includes(limite)) {
    validacion.anotar("limite", `"limite" tiene que ser ${LIMITES_PERMITIDOS.join(", ")}.`);
  }

  const paginaTexto = leer("pagina");
  const pagina = paginaTexto === null ? 0 : Number(paginaTexto);
  if (paginaTexto !== null && !(ENTERO_SIN_SIGNO.test(paginaTexto) && Number.isSafeInteger(pagina))) {
    validacion.anotar("pagina", '"pagina" tiene que ser un entero de 0 o más.');
  }

  validacion.lanzarSiHayProblemas();

  return {
    entidad: leer("entidad"),
    entidadId: leer("entidadId"),
    evento: leer("evento"),
    correoUsuario: leer("correo")?.toLowerCase() ?? null,
    desde,
    hasta,
    limite,
    pagina,
  };
}
