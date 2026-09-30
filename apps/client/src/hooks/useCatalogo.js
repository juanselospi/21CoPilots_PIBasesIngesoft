import { listarProductos } from '../api/catalogo.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

/**
 * Productos del catálogo público: { datos, cargando, error, recargar }.
 * `datos` es la lista tal como la manda el servidor (nombre, precioFinal,
 * disponibilidad...); adaptarla a lo que muestra la pantalla le toca al
 * contenedor que usa el hook (arquitectura.md § 10.1).
 */
export function useCatalogo({ categoria, q, limite, pagina } = {}) {
    return useRecursoRemoto(
        (signal) => listarProductos({ categoria, q, limite, pagina }, { signal }),
        [categoria, q, limite, pagina],
    )
}
