// Precio en dólares (ej. $1 234,50) y textos de disponibilidad para la tarjeta, la ficha, el carrito y el panel
export const priceFormat = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
})

export const availabilityLabels = {
    'in-stock': 'En existencia',
    'backorder': 'Por contrapedido',
    'out-of-stock': 'Fuera de stock',
}
