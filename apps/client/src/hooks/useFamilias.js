import { listarFamiliasAdmin } from '../api/catalogo.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

/** Familias del panel; `datos` trae { nombre, porcentajeImportacion, margenGanancia, activa }. */
export function useFamilias() {
    return useRecursoRemoto((signal) => listarFamiliasAdmin({ signal }), [])
}
