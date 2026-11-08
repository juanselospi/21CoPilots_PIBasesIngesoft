import { Navigate, Outlet, useLocation } from 'react-router'
import { useSesion } from '../../hooks/useSesion.js'

const CLIENT_ROLE = 'cliente'

// Deja pasar a las rutas que son solo del cliente, como Mis pedidos.
// El visitante va a Acceso y regresa aqui despues de entrar, el administrador va a la tienda.
// Igual que en AdminRoute la proteccion real es la del servidor
function ClientRoute() {
    const { usuario, cargando } = useSesion()
    const { pathname, search } = useLocation()

    if (cargando) return <p>Verificando sesión…</p>
    if (!usuario) return <Navigate to={`/acceso?volver=${encodeURIComponent(pathname + search)}`} replace />
    if (usuario.rol !== CLIENT_ROLE) return <Navigate to='/' replace />

    return <Outlet />
}

export default ClientRoute
