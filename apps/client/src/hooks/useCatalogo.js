import { listarProductos } from '../api/catalogo.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

export function useCatalogo({ categoria, q, limite, pagina } = {}) {
    return useRecursoRemoto(
        (signal) => listarProductos({ categoria, q, limite, pagina }, { signal }),
        [categoria, q, limite, pagina],
    )
}
