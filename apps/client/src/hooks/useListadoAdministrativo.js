import { listarParaAdministracion } from '../api/catalogo.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

// Productos del panel; `datos` llega tal cual del servidor: { datos, meta }.
export function useListadoAdministrativo({
    q, categoria, proveedor, disponibilidad, existenciasBajas, margenNegativo, precioMin, precioMax, orden, limite, pagina,
} = {}) {
    const consulta = { q, categoria, proveedor, disponibilidad, existenciasBajas, margenNegativo, precioMin, precioMax, orden, limite, pagina }

    return useRecursoRemoto(
        (signal) => listarParaAdministracion(consulta, { signal }),
        Object.values(consulta),
    )
}
