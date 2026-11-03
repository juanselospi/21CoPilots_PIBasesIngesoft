import { Navigate, Outlet } from 'react-router'
import AdminBar from '../admin-bar/AdminBar.jsx'
import { useSesion } from '../../hooks/useSesion.js'

const ADMIN_ROLE = 'administrador'

// Deja pasar a las rutas /admin/* solo al administrador.
// El visitante va a Acceso y el cliente a la tienda.
// Es solo para la experiencia del usuario, pero la proteccion real es la del servidor, igual protegemos todas las capas.
// Arriba de cada pagina del panel va la barra con el menu de la cuenta
function AdminRoute() {
    const { usuario, cargando, cerrarSesion } = useSesion()

    if (cargando) return <p>Verificando sesión…</p>
    if (!usuario) return <Navigate to='/acceso' replace />
    if (usuario.rol !== ADMIN_ROLE) return <Navigate to='/' replace />

    return (
        <>
            <AdminBar user={usuario} onLogOut={cerrarSesion} />
            <Outlet />
        </>
    )
}

export default AdminRoute
