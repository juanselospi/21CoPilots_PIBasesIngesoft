// Cuentas que salen del carrito que devuelve el servidor, para el contador, los avisos y la pagina del carrito

export const CANTIDAD_MAXIMA = 999

// Reglas de la cantidad para validarCampos, son las mismas que revisa el servidor
export const reglasCantidad = {
    cantidad: { obligatorio: true, tipo: 'entero', minimo: 1, maximo: CANTIDAD_MAXIMA },
}

// Deja la cantidad entre 1 y el maximo que acepta el servidor, lo que no es numero cuenta como 1
export const aCantidad = (texto) => Math.min(Math.max(Number.parseInt(texto, 10) || 1, 1), CANTIDAD_MAXIMA)

// El contador cuenta unidades y no productos: 2 cartas + 1 caja -> 3
export const cantidadEnCarrito = (carrito) =>
    carrito?.lineas.reduce((total, linea) => total + linea.cantidad, 0) ?? 0

// Despues de agregar, si lo que hay en el carrito pasa de las existencias el resto va por contrapedido.
// Devuelve null si no hay que avisar nada
export function avisoDeContrapedido(carrito, sku) {
    const linea = carrito?.lineas.find((l) => l.sku === sku)
    return linea ? avisoDeLinea(linea) : null
}

// Lo mismo pero con la linea ya en la mano, lo usa la pagina del carrito
export function avisoDeLinea(linea) {
    if (!linea.contrapedido) return null

    const unidades = linea.cantidad - linea.existencias
    return unidades === 1
        ? '1 unidad va por contrapedido.'
        : `${unidades} unidades van por contrapedido.`
}

// Como viene la disponibilidad de cada linea -> como la conoce AvailabilityChip
const availabilityByDisponibilidad = {
    en_existencia: 'in-stock',
    contrapedido: 'backorder',
    fuera_de_stock: 'out-of-stock',
}
export const disponibilidadDeLinea = (linea) => availabilityByDisponibilidad[linea.disponibilidad]

// Una linea fuera de stock no se puede comprar: se acabaron las unidades o el producto ya no esta a la venta
export const estaFueraDeStock = (linea) => linea.disponibilidad === 'fuera_de_stock'

// Con una sola linea fuera de stock ya no se puede finalizar la compra
export const hayFueraDeStock = (carrito) => carrito?.lineas.some(estaFueraDeStock) ?? false

// Total de la linea con impuesto
export const totalDeLinea = (linea) => linea.subtotal + linea.impuesto

// Precio de una unidad con impuesto. Si el producto ya no existe el servidor no manda precioFinal,
// asi que se saca del total de la linea
export const precioDeLinea = (linea) => linea.precioFinal ?? totalDeLinea(linea) / linea.cantidad
