import { listarFamiliasAdmin } from '../api/catalogo.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

/**
 * Familias del panel, también las inactivas; `datos` trae
 * { nombre, descripcion, porcentajeImportacion, margenGanancia, activa, totalDeProductos }.
 */
export function useFamilias() {
    return useRecursoRemoto((signal) => listarFamiliasAdmin({ signal }), [])
}
