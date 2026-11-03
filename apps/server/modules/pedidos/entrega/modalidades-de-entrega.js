/**
 * Modalidades de entrega y lo que suman al pedido (RF-62, RN-16).
 *
 * El monto de cada una vive en pedidos.tarifa_envio; aquí está lo que no
 * cambia: el nombre que ve el cliente y si hace falta una dirección.
 */

import { EntradaInvalida } from "../../../shared/errores/errores-de-dominio.js";

export const MODALIDADES = Object.freeze({
  mensajero: { nombre: "Mensajero", exigeDireccion: true },
  uber_flash: { nombre: "Uber Flash", exigeDireccion: true },
  correos_cr: { nombre: "Correos de Costa Rica", exigeDireccion: true },
  // El cliente lo recoge con el negocio, no hay a dónde enviarlo
  entrega_personal: { nombre: "Entrega personal", exigeDireccion: false },
});

/**
 * Revisa la modalidad y la dirección del checkout.
 * @returns la modalidad y la dirección listas para guardar en el pedido
 * @throws {EntradaInvalida} con los campos que tienen problemas
 */
export function validarEntrega({ modalidadEntrega, direccion } = {}) {
  const modalidad = MODALIDADES[modalidadEntrega];
  const direccionLimpia = typeof direccion === "string" ? direccion.trim() || null : null;

  const problemas = [];
  const campos = [];
  if (!modalidad) {
    campos.push("modalidadEntrega");
    problemas.push(`La modalidad de entrega tiene que ser una de: ${Object.keys(MODALIDADES).join(", ")}.`);
  } else if (modalidad.exigeDireccion && !direccionLimpia) {
    campos.push("direccion");
    problemas.push(`Indique la dirección de entrega para ${modalidad.nombre}.`);
  }
  if (problemas.length > 0) throw new EntradaInvalida(problemas.join(" "), campos);

  return {
    modalidadEntrega,
    direccion: modalidad.exigeDireccion ? direccionLimpia : null,
  };
}

// Por ahora el envío se suma sin impuesto; falta confirmarlo con el cliente
// junto con los montos de las tarifas.
export function totalConEntrega({ subtotal, impuesto, costoEntrega }) {
  return redondear(subtotal + impuesto + costoEntrega);
}

const redondear = (monto) => Math.round((monto + Number.EPSILON) * 100) / 100;
