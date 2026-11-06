import { Navigate } from 'react-router'
// Mismo aspecto que la página de productos
import '../products/Products.css'
import './Settings.css'
import { useSesion } from '../../hooks/useSesion.js'
import Employees from './Employees.jsx'

// Pantalla «Configuración» del panel. Por ahora solo tiene los empleados, que son del propietario:
// un empleado no llega a pedir la lista, que el servidor le rechazaría y anotaría en la bitácora.
function Settings() {
    const { usuario } = useSesion()

    if (!usuario?.esPropietario) return <Navigate to='/admin/productos' replace />

    return (
        <main className='products'>
            <section className='products-header'>
                <h1>Configuración</h1>
            </section>
            <Employees />
        </main>
    )
}

export default Settings
