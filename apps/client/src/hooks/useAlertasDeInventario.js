import { listarAlertas } from '../api/inventario.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

const CAMBIO_DE_INVENTARIO = 'inventario:cambio'

/**
 * Alertas de existencias bajas; `datos` trae { datos, meta } con
 * datos = [{ sku, nombre, familia, existencias, admiteContrapedido }] y meta = { umbral, total }.
 * Se vuelven a pedir cuando cambia algo de `dependencias` (por ejemplo, la pantalla abierta).
 */
export function useAlertasDeInventario(dependencias = []) {
    return useRecursoRemoto((signal) => listarAlertas({ signal }), dependencias)
}

// Avisa que cambiaron existencias (un ingreso, un ajuste, una corrección) para que el contador
// de alertas del menú se actualice sin esperar a cambiar de pantalla.
export const avisarCambioDeInventario = () => window.dispatchEvent(new Event(CAMBIO_DE_INVENTARIO))

// Llama a `escuchar` con cada aviso; devuelve la función para dejar de escuchar.
export const alCambiarElInventario = (escuchar) => {
    window.addEventListener(CAMBIO_DE_INVENTARIO, escuchar)
    return () => window.removeEventListener(CAMBIO_DE_INVENTARIO, escuchar)
}
