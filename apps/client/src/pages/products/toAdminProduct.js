// Pasa el producto del listado administrativo (RF-43) a lo que usan la
// tarjeta del panel y ProductEditModal. Los porcentajes vienen de 0 a 100.
export const toAdminProduct = ({ sku, nombre, categoria, precioFinal, costoItem, porcentajeImportacion, margenGanancia }) => ({
    sku,
    name: nombre,
    category: categoria,
    price: precioFinal,
    costoItem,
    importacionPct: porcentajeImportacion,
    margenPct: margenGanancia,
})
