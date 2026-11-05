import { listarPaginaDelCatalogo } from '../api/catalogo.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

/**
 * Una página del catálogo de la tienda; `datos` trae { datos, meta: { total, pagina, limite } }.
 * El servidor filtra, ordena y corta la página: nunca se descarga el catálogo entero.
 */
export function usePaginaDelCatalogo({ categoria, q, disponibilidad, precioMin, precioMax, orden, limite, pagina }) {
    return useRecursoRemoto(
        (signal) => listarPaginaDelCatalogo({ categoria, q, disponibilidad, precioMin, precioMax, orden, limite, pagina }, { signal }),
        [categoria, q, disponibilidad, precioMin, precioMax, orden, limite, pagina],
    )
}
