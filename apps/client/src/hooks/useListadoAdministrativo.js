import { listarParaAdministracion } from '../api/catalogo.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

/**
 * Listado de productos del panel (RF-43): { datos, cargando, error, recargar }.
 * `datos` es { datos, meta } tal como lo manda el servidor; adaptarlo a lo que
 * muestra la pantalla le toca al contenedor (arquitectura.md § 10.1).
 */
export function useListadoAdministrativo({
    q, categoria, proveedor, disponibilidad, existenciasBajas, margenNegativo, precioMin, precioMax, orden, limite, pagina,
} = {}) {
    const consulta = { q, categoria, proveedor, disponibilidad, existenciasBajas, margenNegativo, precioMin, precioMax, orden, limite, pagina }

    return useRecursoRemoto(
        (signal) => listarParaAdministracion(consulta, { signal }),
        Object.values(consulta),
    )
}
