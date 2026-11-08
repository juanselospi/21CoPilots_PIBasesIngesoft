import { buscarClientesAdmin } from '../api/clientes.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

// Con menos de dos letras el servidor no busca, así que ni se le pregunta
export function useBuscarClientes(q) {
    return useRecursoRemoto(
        (signal) => (q.length < 2 ? Promise.resolve([]) : buscarClientesAdmin(q, { signal })),
        [q],
    )
}
