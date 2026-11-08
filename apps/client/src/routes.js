// Ruta de la pagina "Ver todo". Sin categoria lleva al catalogo completo;
// el nombre se codifica porque es texto libre, como "Juegos de cartas (TCG)".
export function catalogPath(category) {
    return category ? `/catalogo/${encodeURIComponent(category)}` : '/catalogo'
}

// Ruta de la ficha de un producto, se identifica por su SKU
export function productPath(sku) {
    return `/producto/${encodeURIComponent(sku)}`
}

// Pagina para finalizar la compra y la confirmacion a la que llega cuando sale bien
export const CHECKOUT_PATH = '/finalizar-compra'
export const CONFIRMATION_PATH = `${CHECKOUT_PATH}/confirmacion`

// Mis pedidos del cliente y el detalle de uno, se identifica por su numero
export const MY_ORDERS_PATH = '/mis-pedidos'

export function myOrderPath(numCarrito) {
    return `${MY_ORDERS_PATH}/${encodeURIComponent(numCarrito)}`
}

// Factura de un pedido, se identifica por su numero
export function invoicePath(numCarrito) {
    return `/pedidos/${encodeURIComponent(numCarrito)}/factura`
}

// Detalle de un pedido en el panel; el número solo se repite entre clientes, por eso va también el correo
export function adminOrderPath(correo, numCarrito) {
    return `/admin/pedidos/${encodeURIComponent(correo)}/${encodeURIComponent(numCarrito)}`
}

// Estado que lleva un enlace hacia una vista secundaria para que su flecha (BackButton) sepa a
// dónde volver: <Link to={…} state={backState(location)}>
export function backState(location) {
    return { from: location.pathname + location.search }
}
