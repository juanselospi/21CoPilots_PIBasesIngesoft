import { obtenerProducto } from '../api/catalogo.js'
import { ErrorHttp } from '../api/clienteHttp.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

/**
 * Ficha de un producto del catalogo publico: { datos, cargando, error, recargar }.
 * Si el producto no existe o esta oculto, `datos` queda en null sin error,
 * asi la pagina distingue "no encontrado" de una falla de conexion.
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
