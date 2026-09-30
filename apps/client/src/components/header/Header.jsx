import { Link } from 'react-router'
import './Header.css'
import { categories } from '../../data/categories.js'

function Header() {
    return (
        <header className='header'>
            <div className='header-top'>
                <div className='header-logo'>LOGO</div>

                <form className='header-search'>
                    <input type='search' placeholder='Buscar en la tienda...' />
                    <button type='submit'>Buscar</button>
                </form>

                <Link to='/acceso'>Iniciar sesión</Link>
                <a href='#'>Carrito (0)</a>
            </div>

            <nav className='header-categories'>
                {categories.map((category) => (
                    <a key={category} href='#'>{category}</a>
                ))}
                <a href='#'>Ver todo</a>
            </nav>
        </header>
    )
}

export default Header
