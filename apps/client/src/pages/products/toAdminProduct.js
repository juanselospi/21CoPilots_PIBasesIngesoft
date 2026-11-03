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

// Texto de cada etiqueta que calcula el servidor
const labelByEtiqueta = {
    contrapedido: 'Por contrapedido',
    margen_negativo: 'Margen negativo',
    existencias_bajas: 'Existencias bajas',
    oculto_en_tienda: 'Oculto en la tienda',
    descontinuado: 'Descontinuado',
}

// Busca el monto de un paso del desglose del precio (costo, importacion, margen, impuesto)
const montoDelPaso = (desglosePrecio, paso) =>
    desglosePrecio?.find((linea) => linea.paso === paso)?.monto ?? null

// Producto del servidor → datos para la tarjeta, la tabla y los modales
export const toAdminProduct = ({
    sku, nombre, categoria, descripcion, proveedor, imagenUrl, precioFinal, existencias, admiteContrapedido,
    etiquetas = [], costoItem, porcentajeImportacion, margenGanancia, heredado, tasaImpuesto, desglosePrecio,
}) => ({
    sku,
    name: nombre,
    category: categoria,
    description: descripcion,
    supplier: proveedor,
    image: imagenUrl,
    imageUrl: imagenUrl,
    price: precioFinal,
    stock: existencias,
    backorder: admiteContrapedido,
    labels: etiquetas.map((etiqueta) => ({ key: etiqueta, text: labelByEtiqueta[etiqueta] ?? etiqueta })),
    // Desactivado: no se ve en la tienda, pero conserva su historial
    discontinued: etiquetas.includes('descontinuado'),
    costoItem,
    // null cuando el producto hereda el valor de su familia
    importacionPct: heredado?.importacion ? null : porcentajeImportacion,
    margenPct: heredado?.margen ? null : margenGanancia,
    taxRate: tasaImpuesto,
    breakdown: {
        costoTotal: montoDelPaso(desglosePrecio, 'importacion'),
        precioSinImpuesto: montoDelPaso(desglosePrecio, 'margen'),
        precioFinal,
    },
})

// Familia del servidor → opción del selector de familia del modal de editar
export const toFamilyOption = ({ nombre, porcentajeImportacion, margenGanancia, activa }) => ({
    name: nombre,
    importacionPct: porcentajeImportacion,
    margenPct: margenGanancia,
    active: activa,
})

// Valores de un modal → cuerpo que espera el servidor. Los campos vacíos no se envían;
// los null sí (al editar, heredar de la familia o borrar un dato opcional).
export const toServerFields = (values) =>
    Object.fromEntries(
        Object.entries(values)
            .filter(([, value]) => value !== '')
            .map(([field, value]) => [serverFieldByModalField[field], value]),
    )

// Campos con error que reporta el servidor → campos del modal
export const toModalFields = (serverFields = []) =>
    Object.keys(serverFieldByModalField).filter((field) => serverFields.includes(serverFieldByModalField[field]))
