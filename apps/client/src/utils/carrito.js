// Cuentas que salen del carrito que devuelve el servidor, para el contador y los avisos

export const CANTIDAD_MAXIMA = 999

// El contador cuenta unidades y no productos: 2 cartas + 1 caja -> 3
export const cantidadEnCarrito = (carrito) =>
    carrito?.lineas.reduce((total, linea) => total + linea.cantidad, 0) ?? 0

// Despues de agregar, si lo que hay en el carrito pasa de las existencias el resto va por contrapedido.
// Devuelve null si no hay que avisar nada
export function avisoDeContrapedido(carrito, sku) {
    const linea = carrito?.lineas.find((l) => l.sku === sku)
    if (!linea?.contrapedido) return null

    const unidades = linea.cantidad - linea.existencias
    return unidades === 1
        ? '1 unidad va por contrapedido.'
        : `${unidades} unidades van por contrapedido.`
}
