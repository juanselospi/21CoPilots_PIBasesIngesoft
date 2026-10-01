import { listarCategorias } from '../api/catalogo.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

/**
 * Categorías del catálogo público: { datos, cargando, error, recargar }.
 * `datos` es la lista tal como la manda el servidor: { nombre, cantidadDeProductos }.
 */
export function useCategorias() {
    return useRecursoRemoto((signal) => listarCategorias({ signal }), [])
}
