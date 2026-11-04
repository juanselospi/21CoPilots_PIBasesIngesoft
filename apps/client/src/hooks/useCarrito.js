import { useContext } from 'react'
import { CartContext } from '../context/CartContext.js'

/**
 * Carrito del cliente con sesión.
 * `carrito` es lo que devolvió el servidor (o null), `cantidad` son las unidades para el contador
 * y `agregar(sku, cantidad)` devuelve el carrito actualizado o lanza el error del servidor.
 */
export function useCarrito() {
    return useContext(CartContext)
}
