import { Link } from 'react-router'
import { LayoutDashboard, Search, ShoppingCart, UserRound } from 'lucide-react'
import './Header.css'
import Logo from '../logo/Logo.jsx'
import UserMenu from '../user-menu/UserMenu.jsx'
import { catalogPath } from '../../routes.js'

const ADMIN_ROLE = 'administrador'

// `user` es el usuario de la sesion o null. Mientras que con `loadingSession` no se muestra ni el usuario ni el enlace de iniciar sesion para que no cambie de golpe.
// `onLogOut` es lo que se llama al confirmar "Cerrar sesión" en el menu de la cuenta
function Header({ categories, user, loadingSession, onLogOut }) {
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
                    <UserMenu user={user} onLogOut={onLogOut} logOutMessage='Vas a salir de tu cuenta.' />
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
