/**
 * DTO + Mapper de carrito y pedidos.
 *
 * POR IMPLEMENTAR
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

/** RF-24: el carrito con sus líneas y totales en dólares. */
export const aCarrito = (carrito) => ({
  numCarrito: carrito.numCarrito,
  lineas: carrito.lineas.map((linea) => ({
    sku: linea.sku,
    nombre: linea.nombre,
    imagenUrl: linea.imagenUrl,
    cantidad: linea.cantidad,
    precioUnitario: linea.precioUnitario,
    tasaImpuesto: linea.tasaImpuesto,
    subtotal: linea.subtotal,
    impuesto: linea.impuesto,
    contrapedido: linea.contrapedido,
  })),
  subtotal: carrito.subtotal,
  impuesto: carrito.impuesto,
  total: carrito.total,
  moneda: "USD",
});
