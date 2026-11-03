import { useCallback, useEffect, useEffectEvent, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { alPerderSesion, ErrorHttp } from '../api/clienteHttp.js'
import { getSession, logOut } from '../api/sesion.js'
import { useRecursoRemoto } from '../hooks/useRecursoRemoto.js'
import { SessionContext } from './SessionContext.js'

const EXPIRED_NOTICE = 'Tu sesión venció, vuelve a iniciar sesión.'

// Pide la sesion una vez al cargar la pagina y la reparte con useSesion.
// Si no se pudo hacer la consulta se trata igual que si no hubiera sesion.
// Tiene que ir dentro del router porque cuando la sesion vence o se cierra hay que cambiar de pagina
function SessionProvider({ children }) {
    const navigate = useNavigate()
    const { datos, cargando, recargar } = useRecursoRemoto((signal) => getSession({ signal }), [])

    // Si llega un 401 y habia usuario es que la sesion vencio, si no habia es un visitante y no se le avisa nada
    const handleSessionLost = useEffectEvent(() => {
        if (!datos) return
        navigate('/acceso', { replace: true, state: { aviso: EXPIRED_NOTICE } })
        recargar()
    })

    useEffect(() => alPerderSesion(() => handleSessionLost()), [])

    // Cierra la sesion en el servidor y vuelve a la tienda. Si ya estaba vencida se toma como si se hubiera cerrado bien
    const cerrarSesion = useCallback(async () => {
        try {
            await logOut()
        } catch (error) {
            if (!(error instanceof ErrorHttp && error.estado === 401)) throw error
        }
        navigate('/', { replace: true })
        recargar()
    }, [navigate, recargar])

    const session = useMemo(
        () => ({ usuario: datos, cargando, recargar, cerrarSesion }),
        [datos, cargando, recargar, cerrarSesion],
    )

    return <SessionContext value={session}>{children}</SessionContext>
}

export default SessionProvider
