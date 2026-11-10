// Ayuda de importación y margen; la usan los modales de producto y de familia.
// Sigue al motor de precios del servidor (catalogo/precio): costo × (1 + importación)
// = costo total; costo total × (1 + margen) = precio sin impuesto. El margen se suma
// sobre el costo, no es la parte del precio de venta que queda como ganancia.
export const percentHelp = {
    importacionPct: 'Se suma al costo del ítem para cubrir los aranceles. Ej.: $100 con 20 % da un costo total de $120.',
    margenPct: 'Ganancia que se suma sobre el costo total (con importación), antes del impuesto. '
        + 'Ej.: $120 con 25 % da $150. Puede ser negativo, pero mayor que -100 %.',
}

// Campos de precio de los modales de agregar y editar producto.
// Los precios derivados los calcula el servidor. `shortLabel` es el nombre dentro de una frase.
export const priceFields = [
    { key: 'costoItem', label: 'Costo del ítem', unit: '$', allowNegative: false },
    { key: 'importacionPct', label: 'Importación (%)', shortLabel: 'la importación', unit: '%', allowNegative: false },
    // Admite margen negativo, pero mayor que -100 %
    { key: 'margenPct', label: 'Margen (%)', shortLabel: 'el margen', unit: '%', allowNegative: true },
]

// Solo dígitos y hasta 2 decimales; el signo negativo únicamente donde se permite
const positiveNumber = /^\d*(\.\d{0,2})?$/
const signedNumber = /^-?\d*(\.\d{0,2})?$/

// Lo que escribió el usuario (coma -> punto), o null si no se acepta
export const readPriceInput = (input, allowNegative) => {
    const value = input.replace(',', '.')
    return (allowNegative ? signedNumber : positiveNumber).test(value) ? value : null
}

// Las mismas reglas en ambos modales; al crear, importación y margen son opcionales.
export const priceRules = {
    costoItem: { obligatorio: true, tipo: 'numero', minimo: 0 },
    importacionPct: { obligatorio: true, tipo: 'numero', minimo: 0 },
    margenPct: {
        obligatorio: true, tipo: 'numero', minimo: -100, exclusivo: true,
        mensajeMinimo: 'El margen debe ser mayor que -100 %.',
    },
}
