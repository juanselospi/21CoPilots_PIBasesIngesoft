// Llamadas al servidor para finalizar la compra: las modalidades de entrega, confirmar el pedido y la factura.

import { pedir } from './clienteHttp.js'

// Las modalidades con su costo: { modalidad, nombre, costo, exigeDireccion }. Es pública.
export function listarModalidades({ signal } = {}) {
    return pedir('/api/pedidos/modalidades', { signal })
}

/**
 * Convierte el carrito en un pedido y lo cobra, todo o nada.
 * Si el pago se rechaza responde 402 y el carrito queda igual.
 * Si ya no alcanzan las existencias responde 409 con el código SIN_EXISTENCIAS.
 */
export function confirmarPedido({ modalidadEntrega, direccion, metodoPago, datosTarjeta }) {
    return pedir('/api/pedidos', {
        metodo: 'POST',
        cuerpo: { modalidadEntrega, direccion, metodoPago, datosTarjeta },
    })
}

// La factura de un pedido del cliente. Si todavía no tiene (contra entrega) el servidor responde 404.
export function obtenerFactura(numCarrito, { signal } = {}) {
    return pedir(`/api/pedidos/${encodeURIComponent(numCarrito)}/factura`, { signal })
}
