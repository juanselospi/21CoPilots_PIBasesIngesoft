/**
 * Revisa lo que manda el panel al registrar un pedido manual: una venta en
 * el local o un pedido que llegó por WhatsApp, Facebook o teléfono.
 */

import { EntradaInvalida } from "../../../shared/errores/errores-de-dominio.js";
import { crearValidacion, texto } from "../../../shared/validacion/validar-campos.js";
import { validarEntrega } from "../entrega/modalidades-de-entrega.js";
import { validarLinea } from "../carrito/validar-linea.js";
import { CANALES } from "../administracion/validar-consulta-de-pedidos.js";
import { CORREO_DE_VENTA_SIN_CUENTA } from "../../../shared/cuentas/venta-sin-cuenta.js";
import { normalizarTelefono } from "../../clientes/reglas-de-contacto.js";


// La web tiene su propio flujo; aquí entra todo lo demás
export const CANALES_MANUALES = Object.freeze(CANALES.filter((canal) => canal !== "web"));
// Se cobran en el momento, así que el pago queda aprobado
export const METODOS_DE_PAGO_EN_EL_NEGOCIO = Object.freeze(["efectivo", "datafono", "sinpe_movil"]);

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LARGO_DEL_NOMBRE = 150;
const MAXIMO_DE_LINEAS = 50;

/**
 * Para alguien sin cuenta llega `clienteNuevo: { nombre, telefono? }` en vez de
 * `correoCliente`; esos datos quedan como destinatario. Su dirección es la
 * de la entrega, `direccion`.
 * @returns `{ correo, sinCuenta, nombreDestinatario, telefonoDestinatario, lineas, canal, metodoPago, modalidadEntrega, direccion }`
 * @throws {EntradaInvalida} con todos los campos que tienen problemas
 */
export function validarPedidoManual(datos = {}) {
  const validacion = crearValidacion();

  let entrega = null;
  try {
    entrega = validarEntrega(datos);
  } catch (error) {
    if (!(error instanceof EntradaInvalida)) throw error;
    validacion.anotar(error.detalles.campos, error.message);
  }

  const canal = texto(datos.canal)?.toLowerCase() ?? null;
  if (!CANALES_MANUALES.includes(canal)) {
    validacion.anotar("canal", `El canal tiene que ser uno de: ${CANALES_MANUALES.join(", ")}.`);
  }

  const metodoPago = datos.metodoPago ?? null;
  if (!METODOS_DE_PAGO_EN_EL_NEGOCIO.includes(metodoPago)) {
    validacion.anotar("metodoPago", `El medio de pago tiene que ser uno de: ${METODOS_DE_PAGO_EN_EL_NEGOCIO.join(", ")}.`);
  }

  const { correo, sinCuenta, nombreDestinatario, telefonoDestinatario = null } = leerCliente(datos, validacion);
  const lineas = leerLineas(datos.lineas, validacion);

  validacion.lanzarSiHayProblemas();
  return { correo, sinCuenta, nombreDestinatario, telefonoDestinatario, lineas, canal, metodoPago, ...entrega };
}

function leerCliente(datos, validacion) {
  const correoEscrito = texto(datos.correoCliente)?.toLowerCase() ?? null;
  const clienteNuevo = datos.clienteNuevo ?? null;

  if (correoEscrito && clienteNuevo) {
    validacion.anotar(["correoCliente", "clienteNuevo"], "Indique el correo del cliente o los datos de alguien sin cuenta, no los dos.");
    return {};
  }

  if (clienteNuevo) {
    const nombre = texto(clienteNuevo.nombre);
    if (!nombre) validacion.anotar("clienteNuevo.nombre", "Indique el nombre de la persona.");
    else if (nombre.length > LARGO_DEL_NOMBRE) {
      validacion.anotar("clienteNuevo.nombre", `El nombre no puede pasar de ${LARGO_DEL_NOMBRE} caracteres.`);
    }
    const telefono = texto(clienteNuevo.telefono);
    const telefonoDestinatario = telefono ? normalizarTelefono(telefono) : null;
    if (telefono && !telefonoDestinatario) {
      validacion.anotar("clienteNuevo.telefono", "El teléfono tiene que tener 8 dígitos, por ejemplo 8888-8888.");
    }
    return { correo: CORREO_DE_VENTA_SIN_CUENTA, sinCuenta: true, nombreDestinatario: nombre, telefonoDestinatario };
  }

  if (!correoEscrito) {
    validacion.anotar("correoCliente", "Indique el correo del cliente, o los datos de alguien sin cuenta en clienteNuevo.");
    return {};
  }
  if (!CORREO.test(correoEscrito)) validacion.anotar("correoCliente", "El correo no es válido.");

  // Para un regalo o un encargo a nombre de otra persona
  const nombreDestinatario = texto(datos.nombreDestinatario);
  if (nombreDestinatario && nombreDestinatario.length > LARGO_DEL_NOMBRE) {
    validacion.anotar("nombreDestinatario", `El nombre no puede pasar de ${LARGO_DEL_NOMBRE} caracteres.`);
  }
  return { correo: correoEscrito, sinCuenta: false, nombreDestinatario };
}

// Una venta con varios productos es un solo pedido; cada producto va una vez
function leerLineas(lineas, validacion) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    validacion.anotar("lineas", "Agregue al menos un producto.");
    return [];
  }
  if (lineas.length > MAXIMO_DE_LINEAS) {
    validacion.anotar("lineas", `Un pedido puede tener hasta ${MAXIMO_DE_LINEAS} productos.`);
    return [];
  }

  const leidas = [];
  lineas.forEach((linea, indice) => {
    try {
      leidas.push(validarLinea(linea ?? {}));
    } catch (error) {
      if (!(error instanceof EntradaInvalida)) throw error;
      validacion.anotar("lineas", `Producto ${indice + 1}: ${error.message}`);
    }
  });

  const repetidos = leidas.map(({ sku }) => sku).filter((sku, i, skus) => skus.indexOf(sku) !== i);
  if (repetidos.length > 0) {
    validacion.anotar("lineas", `${[...new Set(repetidos)].join(", ")} viene más de una vez; sume las cantidades en una sola línea.`);
  }
  return leidas;
}
