/**
 * Cómo se nombra un pedido en los movimientos de inventario y en la
 * bitácora. Los movimientos de un pedido llevan esto como motivo, así se
 * sabe cuántas unidades devolver si se cancela o se edita.
 */

export const motivoDelPedido = (correo, numCarrito) => `Pedido ${correo}/${numCarrito}`;

export const idDelPedido = (correo, numCarrito) => `${correo}/${numCarrito}`;
