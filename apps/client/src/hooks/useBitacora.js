import { listarBitacora } from '../api/bitacora.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

// `datos` llega tal cual del servidor: { datos, meta }
export function useBitacora({ evento, desde, hasta, limite, pagina } = {}) {
    const consulta = { evento, desde, hasta, limite, pagina }

    return useRecursoRemoto(
        (signal) => listarBitacora(consulta, { signal }),
        Object.values(consulta),
    )
}
