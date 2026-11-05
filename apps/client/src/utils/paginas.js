// Cuántos números de página se muestran a la vez en la paginación
const VENTANA = 5

// Números de página alrededor de la actual (empiezan en 0); en los extremos se corre la ventana.
// La usan los listados del panel: productos e historial de movimientos.
export function paginasVisibles(actual, total) {
    const primera = Math.max(0, Math.min(actual - Math.floor(VENTANA / 2), total - VENTANA))
    const ultima = Math.min(total - 1, primera + VENTANA - 1)
    return Array.from({ length: ultima - primera + 1 }, (_, indice) => primera + indice)
}

// Números de página con los extremos y puntos suspensivos ('…') donde se saltan páginas, para
// que con muchas no se dibujen todas: 0 1 2 3 4 … 18, 0 … 7 8 9 … 18 o 0 … 14 15 16 17 18.
// Siempre son como mucho siete elementos, así el ancho no cambia al moverse entre páginas.
const MAXIMO_DE_ELEMENTOS = 7

export function elementosDePaginacion(actual, total) {
    if (total <= MAXIMO_DE_ELEMENTOS) return Array.from({ length: total }, (_, indice) => indice)

    const ultima = total - 1
    if (actual <= 3) return [0, 1, 2, 3, 4, '…', ultima]
    if (actual >= ultima - 3) return [0, '…', ultima - 4, ultima - 3, ultima - 2, ultima - 1, ultima]
    return [0, '…', actual - 1, actual, actual + 1, '…', ultima]
}
