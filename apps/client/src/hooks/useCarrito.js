import { useContext } from 'react'
import { CartContext } from '../context/CartContext.js'

/**
 * Carrito del cliente con sesión.
 * `carrito` es lo que devolvió el servidor (o null) y `cantidad` son las unidades para el contador.
 * `agregar(sku, cantidad)`, `cambiarCantidad(sku, cantidad)` y `quitar(sku)` devuelven el carrito
 * actualizado o lanzan el error del servidor.
 * `actualizar()` lo vuelve a pedir sin quitar el que ya se ve.
 */
export function useCarrito() {
    return useContext(CartContext)
}
