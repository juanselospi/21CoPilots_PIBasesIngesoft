// Llamadas al servidor para finalizar la compra (modalidades de entrega, confirmar el pedido y la factura)
// y para administrar los pedidos desde el panel.

import { pedir } from './clienteHttp.js'

// Las modalidades con su costo: { modalidad, nombre, costo, exigeDireccion }. Es pública.
export function listarModalidades({ signal } = {}) {
    return pedir('/api/pedidos/modalidades', { signal })
}

/**
 * Convierte el carrito en un pedido y lo cobra, todo o nada.
 * Con `usarCredito` primero se usa el saldo a favor; si alcanza, `metodoPago` puede ir en null.
 * Si el pago se rechaza responde 402 y el carrito queda igual, también el saldo.
 * Si ya no alcanzan las existencias responde 409 con el código SIN_EXISTENCIAS.
 */
export function confirmarPedido({ modalidadEntrega, direccion, metodoPago, datosTarjeta, usarCredito = false }) {
    return pedir('/api/pedidos', {
        metodo: 'POST',
        cuerpo: { modalidadEntrega, direccion, metodoPago, datosTarjeta, usarCredito },
    })
}

// La factura de un pedido del cliente. Si todavía no tiene (contra entrega) el servidor responde 404.
export function obtenerFactura(numCarrito, { signal } = {}) {
    return pedir(`/api/pedidos/${encodeURIComponent(numCarrito)}/factura`, { signal })
}

// Un pedido se identifica por el correo del cliente y su número: el número solo no es único
const rutaDelPedido = (correo, numCarrito) =>
    `/api/pedidos/admin/${encodeURIComponent(correo)}/${encodeURIComponent(numCarrito)}`

// Pedidos del panel; responde { datos, meta } con el total para paginar
export function listarPedidosAdmin({ q, estado, canal, limite, pagina } = {}, { signal } = {}) {
    return pedir('/api/pedidos/admin', { parametros: { q, estado, canal, limite, pagina }, signal, conMeta: true })
}

export function obtenerPedidoAdmin(correo, numCarrito, { signal } = {}) {
    return pedir(rutaDelPedido(correo, numCarrito), { signal })
}

// Responde el pedido como quedó. Si el estado ya no permite ese cambio, el servidor lo rechaza.
export function cambiarEstadoPedido(correo, numCarrito, estado) {
    return pedir(`${rutaDelPedido(correo, numCarrito)}/estado`, { metodo: 'POST', cuerpo: { estado } })
}

// Lo que la bitácora guarda de este pedido, de lo más nuevo a lo más viejo; responde { datos, meta }
export function listarCambiosDelPedido(correo, numCarrito, { signal } = {}) {
    return pedir('/api/admin/bitacora', {
        parametros: { entidad: 'pedido', entidadId: `${correo}/${numCarrito}`, limite: 100 },
        signal,
        conMeta: true,
    })
}
