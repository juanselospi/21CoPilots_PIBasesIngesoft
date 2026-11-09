import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Store, TriangleAlert } from 'lucide-react'
import './AdminBar.css'
import Logo from '../logo/Logo.jsx'
import UserMenu from '../user-menu/UserMenu.jsx'
import InventoryAlerts from '../inventory-alerts/InventoryAlerts.jsx'
import { alCambiarElInventario, useAlertasDeInventario } from '../../hooks/useAlertasDeInventario.js'
import ModalPresence from '../modal-presence/ModalPresence.jsx'

// Pantallas del panel; NavLink marca con .active la que está abierta
const sections = [
    { to: '/admin/productos', label: 'Productos' },
    { to: '/admin/familias', label: 'Familias' },
    { to: '/admin/mercancia', label: 'Mercancía' },
    { to: '/admin/ventas', label: 'Ventas' },
    { to: '/admin/pedidos', label: 'Pedidos' },
    { to: '/admin/configuracion', label: 'Configuración' },
]

// Barra de arriba del panel con el logo, las pantallas, las alertas de inventario,
// el enlace a la tienda y el menu de la cuenta
function AdminBar({ user, onLogOut }) {
    // Las alertas se recalculan al cambiar de pantalla, al volver a la pestaña
    // (por ejemplo, después de una venta en la tienda), al abrir el modal
    // y cuando otra pantalla avisa que cambiaron existencias
    const { pathname } = useLocation()
    const alerts = useAlertasDeInventario([pathname])
    const { recargar } = alerts
    const [showAlerts, setShowAlerts] = useState(false)
    // Mientras se recarga no hay número; el contador desaparece en vez de mostrar uno viejo
    const alertCount = alerts.datos?.meta.total ?? 0

    useEffect(() => {
        const reloadWhenVisible = () => document.visibilityState === 'visible' && recargar()
        document.addEventListener('visibilitychange', reloadWhenVisible)
        return () => document.removeEventListener('visibilitychange', reloadWhenVisible)
    }, [recargar])

    useEffect(() => alCambiarElInventario(recargar), [recargar])

    const openAlerts = () => {
        recargar()
        setShowAlerts(true)
    }

    return (
        <header className='admin-bar'>
            <Link to='/' className='admin-bar-logo'><Logo /></Link>
            <nav className='admin-bar-nav' aria-label='Panel de administración'>
                {sections.map(({ to, label }) => <NavLink key={to} to={to}>{label}</NavLink>)}
            </nav>
            <button
                type='button'
                className='admin-bar-alerts'
                aria-haspopup='dialog'
                aria-label={alertCount > 0 ? `Alertas de inventario: ${alertCount}` : 'Alertas de inventario'}
                onClick={openAlerts}
            >
                <TriangleAlert size={18} />Alertas
                {alertCount > 0 && <span className='admin-bar-badge' aria-hidden='true'>{alertCount}</span>}
            </button>
            <Link to='/' className='admin-bar-link'><Store size={20} />Ver tienda</Link>
            <UserMenu user={user} onLogOut={onLogOut} logOutMessage='Vas a salir del panel de administración.' />

            <ModalPresence>
                {showAlerts && <InventoryAlerts alerts={alerts} onClose={() => setShowAlerts(false)} />}
            </ModalPresence>
        </header>
    )
}

export default AdminBar
