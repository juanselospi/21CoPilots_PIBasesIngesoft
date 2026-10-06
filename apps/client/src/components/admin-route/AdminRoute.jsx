import { Navigate, Outlet } from 'react-router'
import { useSesion } from '../../hooks/useSesion.js'

const ADMIN_ROLE = 'administrador'

// Deja pasar a las rutas /admin/* solo al administrador.
// El visitante va a Acceso y el cliente a la tienda.
// Es solo para la experiencia del usuario, pero la proteccion real es la del servidor, igual protegemos todas las capas.
function AdminRoute() {
    const { usuario, cargando } = useSesion()

    if (cargando) return <p>Verificando sesión…</p>
    if (!usuario) return <Navigate to='/acceso' replace />
    if (usuario.rol !== ADMIN_ROLE) return <Navigate to='/' replace />

    return <Outlet />
}

export default AdminRoute
