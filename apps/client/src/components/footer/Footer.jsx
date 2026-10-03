import { Link } from 'react-router'
import './Footer.css'
import { catalogPath } from '../../routes.js'

function Footer({ categories }) {
    return (
        <footer className='footer'>
            <div className='footer-column'>
                <h3>Categorías</h3>
                <ul className='footer-categories'>
                    {categories.map((category) => (
                        <li key={category}>
                            <Link to={catalogPath(category)}>{category}</Link>
                        </li>
                    ))}
                </ul>
            </div>

            <div className='footer-column'>
                <h3>Contacto</h3>
                <a href='mailto:correo@negocio.com'>correo@negocio.com</a>
            </div>

            <div className='footer-column'>
                <h3>Términos</h3>
                <a href='#'>Términos y condiciones</a>
            </div>

            <div className='footer-column'>
                <h3>Admin</h3>
                <Link to='/acceso'>Acceso administrador</Link>
            </div>
        </footer>
    )
}

export default Footer
