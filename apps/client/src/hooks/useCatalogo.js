import { listarProductos } from '../api/catalogo.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

export function useCatalogo({ categoria, q, orden, limite, pagina } = {}) {
    return useRecursoRemoto(
        (signal) => listarProductos({ categoria, q, orden, limite, pagina }, { signal }),
        [categoria, q, orden, limite, pagina],
    )
}
