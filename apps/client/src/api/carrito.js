// Llamadas al servidor para el carrito del cliente.
// Solo el cliente tiene carrito: sin sesión el servidor responde 401 y con otra cuenta 403.

import { pedir } from './clienteHttp.js'

/**
 * Devuelve el carrito activo con sus líneas y totales, o uno vacío si todavía no tiene.
 * Cada línea trae `cantidad`, `existencias` y `contrapedido`.
 */
export function obtenerCarrito({ signal } = {}) {
    return pedir('/api/pedidos/carrito', { signal })
}

/**
 * Agrega el producto o le suma a la línea que ya tenía, y devuelve el carrito completo.
 * Si pasa de las existencias y no admite contrapedido, o si ya no está a la venta, el servidor responde 409 con el mensaje.
 */
export function agregarAlCarrito(sku, cantidad) {
    return pedir('/api/pedidos/carrito/lineas', { metodo: 'POST', cuerpo: { sku, cantidad } })
}
