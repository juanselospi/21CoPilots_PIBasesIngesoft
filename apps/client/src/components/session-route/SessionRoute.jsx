import { Navigate, Outlet } from 'react-router'
import { useSesion } from '../../hooks/useSesion.js'

// Deja pasar a las rutas que necesitan sesion sin importar el rol, como Mi cuenta.
// El visitante va a Acceso. Igual que en AdminRoute la proteccion real es la del servidor
function SessionRoute() {
    const { usuario, cargando } = useSesion()

    if (cargando) return <p>Verificando sesión…</p>
    if (!usuario) return <Navigate to='/acceso' replace />

    return <Outlet />
}

export default SessionRoute
