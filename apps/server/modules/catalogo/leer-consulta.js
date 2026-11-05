/**
 * Lectores de parámetros de consulta de los listados (tienda y panel).
 * Anotan en `validacion` lo que viene mal en vez de lanzar, para responder todo junto.
 */

const ENTERO_SIN_SIGNO = /^\d+$/;
const NUMERO_SIN_SIGNO = /^\d+(\.\d+)?$/;

export function crearLectorDeConsulta(consulta, validacion) {
  // Un parámetro vacío cuenta como que no vino; uno repetido llega como lista y se rechaza.
  const leer = (campo) => {
    const valor = consulta[campo];
    if (valor === undefined) return null;
    if (typeof valor !== "string") {
      validacion.anotar(campo, `"${campo}" solo puede venir una vez.`);
      return null;
    }
    return valor.trim() || null;
  };

  const leerBooleano = (campo) => {
    const valor = leer(campo);
    if (valor === null) return false;
    if (valor !== "true" && valor !== "false") validacion.anotar(campo, `"${campo}" tiene que ser true o false.`);
    return valor === "true";
  };

  const leerPrecio = (campo) => {
    const valor = leer(campo);
    if (valor === null) return null;
    if (!NUMERO_SIN_SIGNO.test(valor)) {
      validacion.anotar(campo, `"${campo}" tiene que ser un número de 0 o más.`);
      return null;
    }
    return Number(valor);
  };

  // precioMin y precioMax, y que el rango no esté al revés
  const leerRangoDePrecio = () => {
    const precioMin = leerPrecio("precioMin");
    const precioMax = leerPrecio("precioMax");
    if (precioMin !== null && precioMax !== null && precioMin > precioMax) {
      validacion.anotar(["precioMin", "precioMax"], '"precioMin" no puede ser mayor que "precioMax".');
    }
    return { precioMin, precioMax };
  };

  // Un valor de una lista permitida (orden, disponibilidad); si no viene, `porDefecto`
  const leerOpcion = (campo, permitidas, porDefecto = null) => {
    const valor = leer(campo) ?? porDefecto;
    if (valor !== null && !permitidas.includes(valor)) {
      validacion.anotar(campo, `"${campo}" tiene que ser uno de: ${permitidas.join(", ")}.`);
    }
    return valor;
  };

  const leerPagina = () => {
    const texto = leer("pagina");
    const pagina = texto === null ? 0 : Number(texto);
    if (texto !== null && !(ENTERO_SIN_SIGNO.test(texto) && Number.isSafeInteger(pagina))) {
      validacion.anotar("pagina", '"pagina" tiene que ser un entero de 0 o más.');
    }
    return pagina;
  };

  // `admite(limite)` decide los tamaños válidos; `mensaje` los explica
  const leerLimite = ({ porDefecto, admite, mensaje }) => {
    const texto = leer("limite");
    const limite = texto === null ? porDefecto : Number(texto);
    if (texto !== null && !(ENTERO_SIN_SIGNO.test(texto) && admite(limite))) {
      validacion.anotar("limite", mensaje);
    }
    return limite;
  };

  return { leer, leerBooleano, leerRangoDePrecio, leerOpcion, leerPagina, leerLimite };
}
