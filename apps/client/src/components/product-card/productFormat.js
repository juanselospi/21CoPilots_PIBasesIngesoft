// Formato del precio y textos de disponibilidad que comparten la tarjeta y la ficha
export const priceFormat = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
})

export const availabilityLabels = {
    'in-stock': 'En existencia',
    'backorder': 'Por contrapedido',
}
