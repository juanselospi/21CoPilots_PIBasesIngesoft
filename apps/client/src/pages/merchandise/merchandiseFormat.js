// Textos de la pantalla «Ingreso de mercancía».

export const unitsText = (count) => (count === 1 || count === -1 ? `${count} unidad` : `${count} unidades`)

// Con signo: +10 suma y −2 resta
export const signedUnits = (count) => (count > 0 ? `+${count}` : String(count))

export const signedUnitsText = (count) => `${signedUnits(count)} ${Math.abs(count) === 1 ? 'unidad' : 'unidades'}`

// Nombre y color de cada tipo de movimiento que guarda el servidor; también son las opciones del filtro
export const movementTypes = {
    ingreso: { label: 'Ingreso', className: 'chip chip-ok' },
    reposicion: { label: 'Reposición', className: 'chip chip-ok' },
    ajuste: { label: 'Ajuste', className: 'chip chip-aviso' },
    venta_en_linea: { label: 'Venta en línea', className: 'chip chip-info' },
    venta_externa: { label: 'Venta externa', className: 'chip chip-info' },
}

// Formas de ajustar; cada una pide la cantidad de otra manera y se convierte en una cantidad con signo
export const adjustmentModes = {
    sumar: {
        label: 'Sumar',
        quantityLabel: 'Unidades a sumar',
        reasonPlaceholder: 'Ej. Se encontraron unidades en bodega',
        toChange: (quantity) => quantity,
    },
    restar: {
        label: 'Restar',
        quantityLabel: 'Unidades a restar',
        reasonPlaceholder: 'Ej. Unidad dañada en bodega',
        toChange: (quantity) => -quantity,
    },
    fijar: {
        label: 'Dejar en',
        quantityLabel: 'Existencias contadas',
        reasonPlaceholder: 'Ej. Conteo físico de fin de mes',
        toChange: (quantity, stock) => quantity - stock,
    },
}

export const dateTimeFormat = new Intl.DateTimeFormat('es-CR', { dateStyle: 'short', timeStyle: 'short' })
