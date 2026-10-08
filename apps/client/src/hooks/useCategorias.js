import { listarCategorias } from '../api/catalogo.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

/** Categorías del catálogo público; `datos` trae { nombre, cantidadDeProductos }. */
export function useCategorias() {
    return useRecursoRemoto((signal) => listarCategorias({ signal }), [])
}
