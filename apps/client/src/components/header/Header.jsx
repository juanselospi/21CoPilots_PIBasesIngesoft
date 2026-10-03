import { Link } from 'react-router'
import './Header.css'
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
                <div className='header-logo'>LOGO</div>

                <form className='header-search'>
                    <input type='search' placeholder='Buscar en la tienda...' />
                    <button type='submit'>Buscar</button>
                </form>

                {user?.rol === ADMIN_ROLE && <Link to='/admin/productos'>Panel</Link>}
                {!loadingSession && (user ? (
                    <span className='header-user'>
                        <span className='header-user-initials' aria-hidden='true'>{toInitials(user.nombre)}</span>
                        Hola, {user.nombre.split(/\s+/)[0]}
                    </span>
                ) : (
                    <Link to='/acceso'>Iniciar sesión</Link>
                ))}
                <a href='#'>Carrito (0)</a>
            </div>

            <nav className='header-categories'>
                {categories.map((category) => (
                    <Link key={category} to={catalogPath(category)}>{category}</Link>
                ))}
                <Link to={catalogPath()}>Ver todo</Link>
            </nav>
        </header>
    )
}

export default Header
