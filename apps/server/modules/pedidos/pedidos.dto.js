/**
 * DTO + Mapper de carrito y pedidos.
 *
 * POR IMPLEMENTAR
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
    precioFinal: linea.precioFinal,
    tasaImpuesto: linea.tasaImpuesto,
    subtotal: linea.subtotal,
    impuesto: linea.impuesto,
    disponibilidad: linea.disponibilidad,
    contrapedido: linea.contrapedido,
    existencias: linea.existencias,
  })),
  subtotal: carrito.subtotal,
  impuesto: carrito.impuesto,
  total: carrito.total,
  moneda: "USD",
});

/** RF-25: el pedido recién confirmado, con el precio congelado de cada línea. */
export const aPedidoConfirmado = (pedido) => ({
  numCarrito: pedido.numCarrito,
  fecha: pedido.fecha,
  estado: pedido.estado,
  modalidadEntrega: pedido.modalidadEntrega,
  direccion: pedido.direccion,
  metodoPago: pedido.metodoPago,
  lineas: pedido.lineas.map((linea) => ({
    sku: linea.sku,
    nombre: linea.nombre,
    cantidad: linea.cantidad,
    precioUnitario: linea.precioUnitario,
    precioFinal: linea.precioFinal,
    tasaImpuesto: linea.tasaImpuesto,
  })),
  subtotal: pedido.subtotal,
  impuesto: pedido.impuesto,
  costoEntrega: pedido.costoEntrega,
  total: pedido.total,
  moneda: "USD",
  pago: pedido.pago,
  factura: pedido.factura ?? null,
});

/** RF-40: un pago del pedido. Nunca lleva datos de la tarjeta. */
export const aPago = (pago) => ({
  numReferencia: pago.numReferencia,
  fecha: pago.fecha,
  monto: pago.monto,
  moneda: "USD",
  metodoPago: pago.metodoPago,
  estadoPago: pago.estadoPago,
});

/** RF-41: la factura como comprobante, con el emisor y el receptor. */
export const aFactura = (factura) => ({
  numFactura: factura.numFactura,
  fecha: factura.fecha,
  emisor: factura.emisor,
  receptor: { nombre: factura.receptor?.nombre ?? null, cedula: factura.receptor?.cedula ?? null },
  lineas: factura.lineas.map((linea) => ({
    sku: linea.sku,
    nombre: linea.nombre,
    cantidad: linea.cantidad,
    precioUnitario: linea.precioUnitario,
    subtotal: linea.subtotal,
  })),
  subtotal: factura.subtotal,
  impuesto: factura.impuesto,
  envio: factura.costoEntrega,
  total: factura.total,
  moneda: "USD",
  metodoPago: factura.metodoPago,
  numReferencia: factura.numReferencia,
});
