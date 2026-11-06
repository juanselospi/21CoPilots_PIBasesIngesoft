import { useSearchParams } from 'react-router'
import { ScrollText, Users } from 'lucide-react'
// Mismo aspecto que la página de productos
import '../products/Products.css'
import './Settings.css'
import { useSesion } from '../../hooks/useSesion.js'
import AuditLog from './AuditLog.jsx'
import Employees from './Employees.jsx'

const sections = [
    { key: 'empleados', label: 'Empleados', Icon: Users, ownerOnly: true, Content: Employees },
    { key: 'bitacora', label: 'Bitácora', Icon: ScrollText, Content: AuditLog },
]

// Pantalla «Configuración» del panel; la pestaña abierta vive en la URL (?seccion=bitacora).
// Un empleado solo ve la bitácora: no llega a pedir la lista de cuentas, que el servidor
// le rechazaría y anotaría como acceso denegado.
function Settings() {
    const { usuario } = useSesion()
    const [searchParams, setSearchParams] = useSearchParams()

    const available = sections.filter(({ ownerOnly }) => !ownerOnly || usuario?.esPropietario)
    const current = available.find(({ key }) => key === searchParams.get('seccion')) ?? available[0]

    return (
        <main className='products'>
            <section className='products-header'>
                <h1>Configuración</h1>
            </section>

            {available.length > 1 && (
                <div className='products-view-toggle settings-tabs' role='tablist' aria-label='Secciones de configuración'>
                    {available.map(({ key, label, Icon }) => (
                        <button
                            key={key}
                            type='button'
                            role='tab'
                            id={`settings-tab-${key}`}
                            aria-selected={current.key === key}
                            aria-controls='settings-panel'
                            className={current.key === key ? 'active' : ''}
                            onClick={() => setSearchParams({ seccion: key }, { replace: true })}
                        >
                            <Icon size={16} />{label}
                        </button>
                    ))}
                </div>
            )}

            <div id='settings-panel' role={available.length > 1 ? 'tabpanel' : undefined} aria-labelledby={available.length > 1 ? `settings-tab-${current.key}` : undefined}>
                <current.Content />
            </div>
        </main>
    )
}

export default Settings
