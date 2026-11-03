import { listarAlertas } from '../api/inventario.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

/**
 * Alertas de existencias bajas; `datos` trae { datos, meta } con
 * datos = [{ sku, nombre, familia, existencias, admiteContrapedido }] y meta = { umbral, total }.
 * Se vuelven a pedir cuando cambia algo de `dependencias` (por ejemplo, la pantalla abierta).
 */
export function useAlertasDeInventario(dependencias = []) {
    return useRecursoRemoto((signal) => listarAlertas({ signal }), dependencias)
}
