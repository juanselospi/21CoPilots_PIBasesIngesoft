import './Footer.css'
import { categories } from '../../data/categories.js'

function Footer() {
    return (
        <footer className='footer'>
            <div className='footer-column'>
                <h3>Categorías</h3>
                <ul className='footer-categories'>
                    {categories.map((category) => (
                        <li key={category}>
                            <a href='#'>{category}</a>
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
                <a href='#'>Acceso administrador</a>
            </div>
        </footer>
    )
}

export default Footer
