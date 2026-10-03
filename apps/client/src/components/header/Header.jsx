import { Link } from 'react-router'
import { LayoutDashboard, Search, ShoppingCart, UserRound } from 'lucide-react'
import './Header.css'
import Logo from '../logo/Logo.jsx'
import { catalogPath } from '../../routes.js'

const ADMIN_ROLE = 'administrador'

// Iniciales para el circulo del usuario: "Juan Loaiza" -> "JL".
const toInitials = (nombre) =>
    nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0].toUpperCase()).join('')

// `user` es el usuario de la sesion o null. Mientras `loadingSession` no se muestra
// ni el usuario ni el enlace de iniciar sesion para que no cambie de golpe.
function Header({ categories, user, loadingSession }) {
    return (
        <header className='header'>
            <div className='header-top'>
                <Link to='/' className='header-logo'><Logo /></Link>

                <form className='header-search'>
                    <input type='search' placeholder='Buscar en la tienda...' />
                    <button type='submit' aria-label='Buscar'><Search size={20} /></button>
                </form>

                {user?.rol === ADMIN_ROLE && (
                    <Link to='/admin/productos' className='header-link'><LayoutDashboard size={20} />Panel</Link>
                )}
                {!loadingSession && (user ? (
                    <span className='header-user'>
                        <span className='header-user-initials' aria-hidden='true'>{toInitials(user.nombre)}</span>
                        Hola, {user.nombre.split(/\s+/)[0]}
                    </span>
                ) : (
                    <Link to='/acceso' className='header-link'><UserRound size={20} />Iniciar sesión</Link>
                ))}
                <a href='#' className='header-cart' aria-label='Carrito, 0 productos'>
                    <ShoppingCart size={20} />
                    Carrito
                    <span className='header-cart-count'>0</span>
                </a>
            </div>

            <nav className='header-categories'>
                {categories.map((category) => (
                    <Link key={category} to={catalogPath(category)}>{category}</Link>
                ))}
                <Link to={catalogPath()} className='header-categories-all'>Ver todo</Link>
            </nav>
        </header>
    )
}

export default Header
