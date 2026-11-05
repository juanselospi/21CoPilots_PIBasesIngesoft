import { listarMovimientos } from '../api/inventario.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

/**
 * Movimientos de inventario; `datos` trae { datos, meta } con
 * datos = [{ sku, nombre, fecha, tipo, cantidad, costoUnitario, motivo, responsable }].
 */
export function useMovimientos(filtros) {
    return useRecursoRemoto((signal) => listarMovimientos(filtros, { signal }), [filtros])
}
