// Traduce los productos del panel (RF-43) entre el formato del servidor
// y el que usan la tarjeta y el modal de editar precio.

// Nombre del campo en el modal → nombre en el servidor
const serverFieldByModalField = {
    costoItem: 'costoItem',
    importacionPct: 'porcentajeImportacion',
    margenPct: 'margenGanancia',
}

// Busca el monto de un paso del desglose del precio (costo, importacion, margen, impuesto)
const montoDelPaso = (desglosePrecio, paso) =>
    desglosePrecio?.find((linea) => linea.paso === paso)?.monto ?? null

// Producto del servidor → datos para la tarjeta y el modal
export const toAdminProduct = ({
    sku, nombre, categoria, precioFinal, costoItem, porcentajeImportacion, margenGanancia, tasaImpuesto, desglosePrecio,
}) => ({
    sku,
    name: nombre,
    category: categoria,
    price: precioFinal,
    costoItem,
    importacionPct: porcentajeImportacion,
    margenPct: margenGanancia,
    taxRate: tasaImpuesto,
    breakdown: {
        costoTotal: montoDelPaso(desglosePrecio, 'importacion'),
        precioSinImpuesto: montoDelPaso(desglosePrecio, 'margen'),
        precioFinal,
    },
})

// Cambios del modal → cuerpo que espera el servidor al guardar el precio
export const toPriceChanges = (values) =>
    Object.fromEntries(Object.entries(values).map(([field, value]) => [serverFieldByModalField[field], value]))

// Campos con error que reporta el servidor → campos del modal
export const toModalFields = (serverFields = []) =>
    Object.keys(serverFieldByModalField).filter((field) => serverFields.includes(serverFieldByModalField[field]))
