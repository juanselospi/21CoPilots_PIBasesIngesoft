import { useContext } from 'react'
import { SessionContext } from '../context/SessionContext.js'

/**
 * Sesion actual: { usuario, cargando, recargar }.
 * `usuario` es { correo, nombre, rol } o null si nadie inicio sesion.
 * Despues de iniciar sesion hay que llamar a `recargar` para que el resto de la pagina se entere.
 */
export function useSesion() {
    return useContext(SessionContext)
}
