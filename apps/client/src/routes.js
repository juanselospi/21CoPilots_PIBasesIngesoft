// Ruta de la pagina "Ver todo". Sin categoria lleva al catalogo completo;
// el nombre se codifica porque es texto libre, como "Juegos de cartas (TCG)".
export function catalogPath(category) {
    return category ? `/catalogo/${encodeURIComponent(category)}` : '/catalogo'
}
