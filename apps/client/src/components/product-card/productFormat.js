// Formato del precio y textos de disponibilidad que comparten la tarjeta, la ficha y el panel
// Precios en dólares con el símbolo $ (ej. $1 234,50)
export const priceFormat = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
})

export const availabilityLabels = {
    'in-stock': 'En existencia',
    'backorder': 'Por contrapedido',
}
