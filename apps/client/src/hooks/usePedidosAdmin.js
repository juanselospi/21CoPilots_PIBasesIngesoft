import { listarCambiosDelPedido, listarPedidosAdmin, obtenerPedidoAdmin } from '../api/pedidos.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

// Pedidos del panel; `datos` llega tal cual del servidor: { datos, meta }.
export function usePedidosAdmin({ q, estado, canal, limite, pagina } = {}) {
    const consulta = { q, estado, canal, limite, pagina }

    return useRecursoRemoto(
        (signal) => listarPedidosAdmin(consulta, { signal }),
        Object.values(consulta),
    )
}

// Un pedido completo, con los estados a los que puede pasar
export function usePedidoAdmin(correo, numCarrito) {
    return useRecursoRemoto(
        (signal) => obtenerPedidoAdmin(correo, numCarrito, { signal }),
        [correo, numCarrito],
    )
}

// Historial de cambios del pedido; `datos` trae { datos, meta }
export function useCambiosDelPedido(correo, numCarrito) {
    return useRecursoRemoto(
        (signal) => listarCambiosDelPedido(correo, numCarrito, { signal }),
        [correo, numCarrito],
    )
}
