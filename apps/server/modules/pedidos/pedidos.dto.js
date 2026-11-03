/**
 * DTO + Mapper de carrito y pedidos.
 *
 * POR IMPLEMENTAR
 *   aCarrito()           RF-24 — líneas, subtotal, impuesto, total
 *   aPedido()            RF-25, RF-27 — estado visible para el cliente
 *   aComprobante()       RF-31
 *   aPedidoAdministrativo()  RF-46 — agrega datos que el cliente no ve
 */

/** Modalidad de entrega con su costo, para el checkout. */
export const aModalidad = (modalidad) => ({
  modalidad: modalidad.modalidad,
  nombre: modalidad.nombre,
  costo: modalidad.costo,
  moneda: "USD",
  exigeDireccion: modalidad.exigeDireccion,
});
