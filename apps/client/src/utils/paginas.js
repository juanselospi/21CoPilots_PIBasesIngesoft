// Cuántos números de página se muestran a la vez en la paginación
const VENTANA = 5

// Números de página alrededor de la actual (empiezan en 0); en los extremos se corre la ventana.
// La usan los listados del panel: productos e historial de movimientos.
export function paginasVisibles(actual, total) {
    const primera = Math.max(0, Math.min(actual - Math.floor(VENTANA / 2), total - VENTANA))
    const ultima = Math.min(total - 1, primera + VENTANA - 1)
    return Array.from({ length: ultima - primera + 1 }, (_, indice) => primera + indice)
}
