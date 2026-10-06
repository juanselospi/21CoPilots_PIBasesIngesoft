import { obtenerProducto } from '../api/catalogo.js'
import { ErrorHttp } from '../api/clienteHttp.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

/**
 * Ficha de un producto del catalogo publico.
 * Si el producto no existe o esta oculto, `datos` queda en null sin error.
 */
export function useProducto(sku) {
    return useRecursoRemoto(
        (signal) => obtenerProducto(sku, { signal }).catch((error) => {
            if (error instanceof ErrorHttp && error.estado === 404) return null
            throw error
        }),
        [sku],
    )
}
