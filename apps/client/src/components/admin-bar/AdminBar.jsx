import { Link } from 'react-router'
import { Store } from 'lucide-react'
import './AdminBar.css'
import Logo from '../logo/Logo.jsx'
import UserMenu from '../user-menu/UserMenu.jsx'

// Barra de arriba del panel con el logo, el enlace a la tienda y el menu de la cuenta
function AdminBar({ user, onLogOut }) {
    return (
        <header className='admin-bar'>
            <Link to='/' className='admin-bar-logo'><Logo /></Link>
            <Link to='/' className='admin-bar-link'><Store size={20} />Ver tienda</Link>
            <UserMenu user={user} onLogOut={onLogOut} logOutMessage='Vas a salir del panel de administración.' />
        </header>
    )
}

export default AdminBar
