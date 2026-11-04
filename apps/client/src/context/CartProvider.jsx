import { useCallback, useMemo, useState } from 'react'
import { agregarAlCarrito, obtenerCarrito } from '../api/carrito.js'
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

    // Lo ultimo que devolvio el servidor al agregar, asi el contador sube sin volver a pedir el carrito.
    // Se guarda con el correo para que no se mezcle si cambia la cuenta
    const [latest, setLatest] = useState(null)
    const carrito = latest && latest.correo === correo ? latest.carrito : remoto.datos

    const { recargar: reloadRemote } = remoto
    const recargar = useCallback(() => {
        setLatest(null)
        reloadRemote()
    }, [reloadRemote])

    const agregar = useCallback(async (sku, cantidad) => {
        const actualizado = await agregarAlCarrito(sku, cantidad)
        setLatest({ correo, carrito: actualizado })
        return actualizado
    }, [correo])

    const cart = useMemo(
        () => ({ carrito, cantidad: cantidadEnCarrito(carrito), agregar, recargar }),
        [carrito, agregar, recargar],
    )

    return <CartContext value={cart}>{children}</CartContext>
}

export default CartProvider
