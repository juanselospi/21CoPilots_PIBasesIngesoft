import { Link, Outlet } from 'react-router'
import { ChevronLeft, ShoppingCart } from 'lucide-react'
import './AccessLayout.css'
import Logo from '../logo/Logo.jsx'

// Estructura de las pantallas de acceso: iniciar sesion, pedir el enlace y restablecer la contraseña.
// Todas van en la misma tarjeta, cada pagina pone lo de adentro
function AccessLayout() {
    return (
        <div className='access'>
            <header className='access-topbar'>
                <Link to='/' className='access-logo'><Logo /></Link>
                <Link to='/' className='access-back'><ChevronLeft size={20} />Volver a la tienda</Link>
                <a href='#' className='access-cart'><ShoppingCart size={20} />Carrito (0)</a>
            </header>

            <main className='access-main'>
                <section className='access-card'>
                    <Outlet />
                </section>
            </main>
        </div>
    )
}

export default AccessLayout
