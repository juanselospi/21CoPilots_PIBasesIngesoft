// Campos de precio de los modales de agregar y editar producto.
// Los precios derivados los calcula el servidor.
export const priceFields = [
    { key: 'costoItem', label: 'Costo del ítem', unit: '$', allowNegative: false },
    { key: 'importacionPct', label: 'Importación', unit: '%', allowNegative: false },
    // Admite margen negativo, pero mayor que -100 %
    { key: 'margenPct', label: 'Margen', unit: '%', allowNegative: true },
]

// Solo dígitos y hasta 2 decimales; el signo negativo únicamente donde se permite
const positiveNumber = /^\d*(\.\d{0,2})?$/
const signedNumber = /^-?\d*(\.\d{0,2})?$/

// Lo que escribió el usuario (coma → punto), o null si no se acepta
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
