/**
 * DTO + Mapper de carrito y pedidos.
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
  creditoUsado: pedido.creditoUsado ?? 0,
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

// Lo que el cliente ve de sus pedidos. Va aparte del panel para que no le llegue
// el canal, quien lo creo ni los botones de accion
const datosDeMiPedido = (pedido) => ({
  numCarrito: pedido.numCarrito,
  fecha: pedido.fecha,
  estado: pedido.estado,
  modalidadEntrega: pedido.modalidadEntrega,
  subtotal: pedido.subtotal,
  impuesto: pedido.impuesto,
  costoEntrega: pedido.costoEntrega,
  total: pedido.total,
  moneda: "USD",
});

export const aMiPedidoEnListado = (pedido) => ({
  ...datosDeMiPedido(pedido),
  unidades: pedido.unidades,
});

export const aMiPedido = (pedido) => ({
  ...datosDeMiPedido(pedido),
  direccion: pedido.direccion,
  lineas: pedido.lineas.map((linea) => ({
    sku: linea.sku,
    nombre: linea.nombre,
    cantidad: linea.cantidad,
    precioUnitario: linea.precioUnitario,
    subtotal: linea.subtotal,
  })),
  pagos: pedido.pagos.map(aPago),
  creditoOtorgado: pedido.creditoOtorgado ?? 0,
  // El enlace a la factura solo sale si ya hay una, contra entrega no la tiene hasta que se pague
  factura: pedido.factura && { numFactura: pedido.factura.numFactura },
});

// Lo que el panel muestra de cualquier pedido, en el listado y en el detalle
const datosDelPedido = (pedido) => ({
  correoCliente: pedido.correoCliente,
  numCarrito: pedido.numCarrito,
  fecha: pedido.fecha,
  estado: pedido.estado,
  canal: pedido.canal,
  creadoPor: pedido.creadoPor,
  nombreDestinatario: pedido.nombreDestinatario,
  modalidadEntrega: pedido.modalidadEntrega,
  subtotal: pedido.subtotal,
  impuesto: pedido.impuesto,
  costoEntrega: pedido.costoEntrega,
  total: pedido.total,
  moneda: "USD",
});

/** RF-46: una fila del listado de pedidos del panel. */
export const aPedidoEnListado = (pedido) => ({
  ...datosDelPedido(pedido),
  cliente: { nombre: pedido.nombreCliente, cedula: pedido.cedula },
  productos: pedido.productos.map(({ sku, nombre, cantidad }) => ({ sku, nombre, cantidad })),
  unidades: pedido.unidades,
  // El del último pago; null si el pedido todavía no tiene ninguno
  estadoPago: pedido.estadoPago ?? null,
});

/** RF-46: el pedido completo, con lo que el cliente no ve. */
export const aPedidoAdministrativo = (pedido) => ({
  ...datosDelPedido(pedido),
  nombreCreadoPor: pedido.nombreCreadoPor,
  cliente: { nombre: pedido.nombreCliente, cedula: pedido.cedula, telefonos: pedido.telefonos },
  direccion: pedido.direccion,
  fechaEntrega: pedido.fechaEntrega,
  lineas: pedido.lineas.map((linea) => ({
    sku: linea.sku,
    nombre: linea.nombre,
    cantidad: linea.cantidad,
    precioUnitario: linea.precioUnitario,
    tasaImpuesto: linea.tasaImpuesto,
    subtotal: linea.subtotal,
  })),
  pagos: pedido.pagos.map(aPago),
  // Lo que se le acreditó al cliente por cambios a este pedido ya pagado
  creditoOtorgado: pedido.creditoOtorgado ?? 0,
  factura: pedido.factura && {
    numFactura: pedido.factura.numFactura,
    fecha: pedido.factura.fecha,
    numReferencia: pedido.factura.numReferencia,
  },
  historial: pedido.historial.map(({ estado, fecha }) => ({ estado, fecha })),
  // Los botones de acción del panel salen de aquí
  estadosSiguientes: pedido.estadosSiguientes,
  lineasEditables: pedido.lineasEditables,
});
