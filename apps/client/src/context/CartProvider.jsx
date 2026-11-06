import { useCallback, useMemo, useState } from 'react'
import { agregarAlCarrito, cambiarCantidadDeLinea, obtenerCarrito, quitarDelCarrito } from '../api/carrito.js'
import { useRecursoRemoto } from '../hooks/useRecursoRemoto.js'
import { useSesion } from '../hooks/useSesion.js'
import { cantidadEnCarrito } from '../utils/carrito.js'
import { CartContext } from './CartContext.js'

const CLIENT_ROLE = 'cliente'

// Pide el carrito del cliente y lo reparte con useCarrito. Va dentro de SessionProvider
// porque se vuelve a pedir cada vez que alguien inicia o cierra sesion.
// El visitante y el administrador no tienen carrito por ahora, para ellos queda vacio
function CartProvider({ children }) {
    const { usuario } = useSesion()
    const correo = usuario?.rol === CLIENT_ROLE ? usuario.correo : null
    const remoto = useRecursoRemoto(
        (signal) => (correo ? obtenerCarrito({ signal }) : Promise.resolve(null)),
        [correo],
    )

    // Lo ultimo que devolvio el servidor, asi el contador y la pagina del carrito cambian sin volver a pedirlo.
    // Se guarda con el correo para que no se mezcle si cambia la cuenta
    const [latest, setLatest] = useState(null)
    const carrito = latest && latest.correo === correo ? latest.carrito : remoto.datos

    const { recargar: reloadRemote } = remoto
    const recargar = useCallback(() => {
        setLatest(null)
        reloadRemote()
    }, [reloadRemote])

    // Todas las llamadas devuelven el carrito completo, este lo guarda y lo devuelve igual
    const keep = useCallback((actualizado) => {
        setLatest({ correo, carrito: actualizado })
        return actualizado
    }, [correo])

    const agregar = useCallback(async (sku, cantidad) => keep(await agregarAlCarrito(sku, cantidad)), [keep])

    const cambiarCantidad = useCallback(
        async (sku, cantidad) => keep(await cambiarCantidadDeLinea(sku, cantidad)),
        [keep],
    )

    const quitar = useCallback(async (sku) => keep(await quitarDelCarrito(sku)), [keep])

    // Vuelve a pedir el carrito pero deja el anterior mientras llega, asi el contador no baja a 0 un momento.
    // Lo usa la pagina del carrito al entrar para traer los precios y las existencias de hoy
    const actualizar = useCallback(async (signal) => {
        if (!correo) return null
        return keep(await obtenerCarrito({ signal }))
    }, [correo, keep])

    const cart = useMemo(
        () => ({
            carrito,
            cantidad: cantidadEnCarrito(carrito),
            agregar,
            cambiarCantidad,
            quitar,
            actualizar,
            recargar,
        }),
        [carrito, agregar, cambiarCantidad, quitar, actualizar, recargar],
    )

    return <CartContext value={cart}>{children}</CartContext>
}

export default CartProvider
