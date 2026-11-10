/**
 * Revisa los filtros de GET /admin, el listado de pedidos del panel.
 */

import { crearValidacion, texto } from "../../../shared/validacion/validar-campos.js";
import { ESTADOS } from "../estados/maquina-de-estados.js";

/** Por dónde llegó el pedido; los que no son web los registra un administrador. */
export const CANALES = Object.freeze(["web", "whatsapp", "facebook", "telefono", "presencial"]);

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const LIMITES_PERMITIDOS = Object.freeze([25, 50, 100]);
const UN_DIA = 24 * 60 * 60 * 1000;

/** @returns los filtros; `hasta` incluye todo ese día y los vacíos quedan en null */
export function validarConsultaDePedidos(consulta = {}) {
  const validacion = crearValidacion();
  const leer = (campo) => (typeof consulta[campo] === "string" ? texto(consulta[campo]) : null);

  const leerUnoDe = (campo, permitidos) => {
    const valor = leer(campo)?.toLowerCase() ?? null;
    if (valor === null || permitidos.includes(valor)) return valor;
    validacion.anotar(campo, `"${campo}" tiene que ser uno de: ${permitidos.join(", ")}.`);
    return null;
  };

  const leerFecha = (campo) => {
    const valor = leer(campo);
    if (valor === null) return null;
    const fecha = new Date(`${valor}T00:00:00`);
    if (FECHA.test(valor) && !Number.isNaN(fecha.getTime())) return fecha;
    validacion.anotar(campo, `"${campo}" tiene que ser una fecha como 2026-11-03.`);
    return null;
  };

  const estado = leerUnoDe("estado", Object.values(ESTADOS));
  const canal = leerUnoDe("canal", CANALES);

  const desde = leerFecha("desde");
  const hastaElDia = leerFecha("hasta");
  const hasta = hastaElDia && new Date(hastaElDia.getTime() + UN_DIA);
  if (desde && hasta && desde >= hasta) {
    validacion.anotar(["desde", "hasta"], '"desde" no puede ser posterior a "hasta".');
  }

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
  return {
    estado,
    canal,
    correo: leer("correo")?.toLowerCase() ?? null,
    busqueda: interpretarBusqueda(leer("q")),
    desde,
    hasta,
    limite,
    pagina,
  };
}

/**
 * El buscador del panel solo busca por nombre del cliente o correo:
 *  - `{ texto }` si tiene letras o @: va sin tildes, en minúsculas y con los
 *    comodines de LIKE escapados, para compararlo por partes con el nombre y el correo;
 *  - `{ invalida: true }` para lo demás (como «4» o «28/10»), que no coincide con nada.
 * @returns la búsqueda, o null si no se escribió nada
 */
export function interpretarBusqueda(q) {
  if (!q) return null;
  if (!/[\p{L}@]/u.test(q)) return { invalida: true };
  return { texto: sinTildes(q).replace(/\s+/g, " ").replace(/[\\%_]/g, "\\$&") };
}

// «José Núñez» -> «jose nunez»; la consulta le hace lo mismo al nombre guardado
export const sinTildes = (texto) => texto.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
