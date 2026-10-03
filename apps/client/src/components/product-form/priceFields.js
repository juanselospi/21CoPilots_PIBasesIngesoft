// Campos de precio que comparten los modales de agregar y editar producto (SCRUM-23).
// Los precios derivados los calcula el servidor (RF-03, RF-04, RF-05).
export const priceFields = [
    { key: 'costoItem', label: 'Costo del ítem', unit: '₡', allowNegative: false },
    { key: 'importacionPct', label: 'Importación', unit: '%', allowNegative: false },
    // RN-02, RF-43: admite margen negativo, pero mayor que -100 %
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

// Errores de los campos de precio; los de `optional` pueden quedar vacíos
export const validatePrices = (values, optional = []) => {
    const errors = {}
    for (const { key } of priceFields) {
        const value = values[key]
        if (value === '' && optional.includes(key)) continue
        if (value === '' || value === '-' || value === '.' || Number.isNaN(Number(value))) {
            errors[key] = 'Ingrese un número válido.'
        }
    }
    if (!errors.margenPct && values.margenPct !== '' && Number(values.margenPct) <= -100) {
        errors.margenPct = 'El margen debe ser mayor que -100 %.'
    }
    return errors
}
