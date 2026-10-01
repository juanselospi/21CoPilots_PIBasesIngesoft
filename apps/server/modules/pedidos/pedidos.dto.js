/**
 * DTO + Mapper de carrito y pedidos.
 *
 * PENDIENTE: el pedido sale con numCarrito en lugar de id, y su estado viene del historial.
 *
 * RNF-09: por estos objetos no puede circular ningún dato de tarjeta. Del
 * cobro solo sale la referencia devuelta por la pasarela y su estado.
 *
 * POR IMPLEMENTAR
 *   aCarrito()           RF-24 — líneas, subtotal, impuesto, total
 *   aPedido()            RF-25, RF-27 — estado visible para el cliente
 *   aComprobante()       RF-31
 *   aPedidoAdministrativo()  RF-46 — agrega datos que el cliente no ve
 */
