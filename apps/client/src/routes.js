// Ruta de la pagina "Ver todo". Sin categoria lleva al catalogo completo;
// el nombre se codifica porque es texto libre, como "Juegos de cartas (TCG)".
export function catalogPath(category) {
    return category ? `/catalogo/${encodeURIComponent(category)}` : '/catalogo'
}

// Ruta de la ficha de un producto, se identifica por su SKU
export function productPath(sku) {
    return `/producto/${encodeURIComponent(sku)}`
}
