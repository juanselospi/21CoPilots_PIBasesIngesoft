import { useMemo } from 'react'
import { getSession } from '../api/sesion.js'
import { useRecursoRemoto } from '../hooks/useRecursoRemoto.js'
import { SessionContext } from './SessionContext.js'

// Pide la sesion una vez al cargar la pagina y la reparte con useSesion
// Si no se pudo hacer la consulta se trata igual que si no hubiera sesion
function SessionProvider({ children }) {
    const { datos, cargando, recargar } = useRecursoRemoto((signal) => getSession({ signal }), [])

    const session = useMemo(
        () => ({ usuario: datos, cargando, recargar }),
        [datos, cargando, recargar],
    )

    return <SessionContext value={session}>{children}</SessionContext>
}

export default SessionProvider
