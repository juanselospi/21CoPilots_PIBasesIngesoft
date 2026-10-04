// Traduce los productos del panel entre el formato del servidor
// y el que usan la tarjeta, la tabla y los modales de agregar y editar producto.

// Nombre del campo en los modales → nombre en el servidor
const serverFieldByModalField = {
    sku: 'sku',
    name: 'nombre',
    category: 'categoria',
    supplier: 'proveedor',
    description: 'descripcion',
    imageUrl: 'imagenUrl',
    stock: 'existencias',
    backorder: 'admiteContrapedido',
    costoItem: 'costoItem',
    importacionPct: 'porcentajeImportacion',
    margenPct: 'margenGanancia',
}

// Texto de cada etiqueta que calcula el servidor (RF-43)
const labelByEtiqueta = {
    contrapedido: 'Por contrapedido',
    margen_negativo: 'Margen negativo',
    existencias_bajas: 'Existencias bajas',
    oculto_en_tienda: 'Oculto en la tienda',
}

// Busca el monto de un paso del desglose del precio (costo, importacion, margen, impuesto)
const montoDelPaso = (desglosePrecio, paso) =>
    desglosePrecio?.find((linea) => linea.paso === paso)?.monto ?? null

// Producto del servidor → datos para la tarjeta, la tabla y los modales
export const toAdminProduct = ({
    sku, nombre, categoria, imagenUrl, precioFinal, existencias, admiteContrapedido, etiquetas = [],
    costoItem, porcentajeImportacion, margenGanancia, tasaImpuesto, desglosePrecio,
}) => ({
    sku,
    name: nombre,
    category: categoria,
    image: imagenUrl,
    price: precioFinal,
    stock: existencias,
    backorder: admiteContrapedido,
    labels: etiquetas.map((etiqueta) => ({ key: etiqueta, text: labelByEtiqueta[etiqueta] ?? etiqueta })),
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

// Valores de un modal → cuerpo que espera el servidor. Los campos vacíos no se envían.
export const toServerFields = (values) =>
    Object.fromEntries(
        Object.entries(values)
            .filter(([, value]) => value !== '')
            .map(([field, value]) => [serverFieldByModalField[field], value]),
    )

// Campos con error que reporta el servidor → campos del modal
export const toModalFields = (serverFields = []) =>
    Object.keys(serverFieldByModalField).filter((field) => serverFields.includes(serverFieldByModalField[field]))
