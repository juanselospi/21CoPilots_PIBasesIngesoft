import { useRef, useState } from 'react'
import { CircleCheck, Crown, EyeOff, Plus, Power, PowerOff } from 'lucide-react'
import '../../components/product-table/ProductTable.css'
import ConfirmDialog from '../../components/confirm-dialog/ConfirmDialog.jsx'
import Notice from '../../components/notice/Notice.jsx'
import { cambiarActivoEmpleado, crearEmpleado } from '../../api/empleados.js'
import { useEmpleados } from '../../hooks/useEmpleados.js'
import EmployeeForm from './EmployeeForm.jsx'
import ModalPresence from '../../components/modal-presence/ModalPresence.jsx'

// Texto del diálogo de confirmación de cada acción
const dialogByAction = {
    desactivar: ({ nombre }) => ({
        title: `Desactivar a ${nombre}`,
        message: 'Ya no podrá entrar al panel y se cierran sus sesiones abiertas. La cuenta no se borra: lo que hizo sigue en la bitácora.',
        confirmLabel: 'Desactivar',
        busyLabel: 'Desactivando…',
    }),
    reactivar: ({ nombre }) => ({
        title: `Reactivar a ${nombre}`,
        message: 'Podrá volver a entrar al panel con su correo y su contraseña.',
        confirmLabel: 'Reactivar',
        busyLabel: 'Reactivando…',
    }),
}

const noticeByAction = {
    desactivar: ({ nombre }) => `Se desactivó la cuenta de ${nombre}.`,
    reactivar: ({ nombre }) => `Se reactivó la cuenta de ${nombre}.`,
}

// Sección «Empleados» de Configuración (HU-02): consulta, crea, desactiva y reactiva cuentas.
function Employees() {
    const empleados = useEmpleados()
    const accounts = empleados.datos ?? []
    const [creating, setCreating] = useState(false)
    // Acción esperando confirmación: { action, account }
    const [pending, setPending] = useState(null)
    // Aviso de éxito: { id, text }; cada uno lleva su id para arrancar con su propio tiempo
    const [notice, setNotice] = useState(null)
    const noticeId = useRef(0)
    const showNotice = (text) => setNotice({ id: ++noticeId.current, text })
    // Solo lo quita si sigue siendo el mismo: uno viejo no cierra a uno nuevo
    const closeNotice = (id) => setNotice((current) => (current?.id === id ? null : current))

    // Quien creó la cuenta siempre es otra cuenta de esta lista; se muestra por su nombre
    const nameOf = (correo) => accounts.find((account) => account.correo === correo)?.nombre ?? correo

    // Crea la cuenta, cierra el modal y recarga la tabla. Le devuelve al modal el error si el servidor la rechazó.
    const handleCreate = async (values) => {
        try {
            const creada = await crearEmpleado(values)
            setCreating(false)
            showNotice(`Se creó la cuenta de ${creada.nombre}. Ya puede entrar al panel con su correo y su contraseña.`)
            empleados.recargar()
            return {}
        } catch (error) {
            return { error: error.message, fields: error.detalles?.campos ?? [] }
        }
    }

    // Si falla, el diálogo muestra el mensaje del servidor
    const runAction = async () => {
        const { action, account } = pending
        await cambiarActivoEmpleado(account.correo, action === 'reactivar')
        setPending(null)
        showNotice(noticeByAction[action](account))
        empleados.recargar()
    }

    const openForm = () => {
        setNotice(null)
        setCreating(true)
    }

    const askAction = (action, account) => {
        setNotice(null)
        setPending({ action, account })
    }

    return (
        <section className='settings-section'>
            <div className='settings-section-header'>
                <div>
                    <h2>Empleados</h2>
                    <p>Entran al panel igual que el propietario, salvo crear cuentas y configurar el negocio.</p>
                </div>
                <button type='button' className='products-button products-button-primary' onClick={openForm}>
                    <Plus size={20} />Agregar empleado
                </button>
            </div>

            {notice && (
                <Notice key={notice.id} onClose={() => closeNotice(notice.id)}>
                    {notice.text}
                </Notice>
            )}

            {empleados.cargando ? (
                <p className='products-status' role='status'>Cargando empleados…</p>
            ) : empleados.error ? (
                <div className='products-status products-status-error' role='alert'>
                    <p>{empleados.error}</p>
                    <button type='button' className='products-status-button' onClick={empleados.recargar}>
                        Reintentar
                    </button>
                </div>
            ) : (
                <div className='product-table-wrapper'>
                    <table className='product-table'>
                        <thead>
                            <tr>
                                <th scope='col'>Nombre</th>
                                <th scope='col'>Correo</th>
                                <th scope='col'>Estado</th>
                                <th scope='col'>Creado por</th>
                                <th scope='col'><span className='product-table-hidden'>Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((account) => (
                                <tr key={account.correo}>
                                    <td>
                                        <div className='settings-name'>
                                            {account.nombre}
                                            {account.esPropietario && <span className='chip chip-info'><Crown size={16} />Propietario</span>}
                                        </div>
                                    </td>
                                    <td>{account.correo}</td>
                                    <td>
                                        {account.activo ? (
                                            <span className='chip chip-ok'><CircleCheck size={16} />Activo</span>
                                        ) : (
                                            <span className='chip'><EyeOff size={16} />Inactivo</span>
                                        )}
                                    </td>
                                    <td>{account.creadoPor ? nameOf(account.creadoPor) : '—'}</td>
                                    <td>
                                        {/* La cuenta del propietario no se puede desactivar */}
                                        {!account.esPropietario && (
                                            <div className='product-table-actions'>
                                                {account.activo ? (
                                                    <button
                                                        type='button'
                                                        className='product-table-button product-table-button-danger'
                                                        aria-label={`Desactivar a ${account.nombre}`}
                                                        onClick={() => askAction('desactivar', account)}
                                                    >
                                                        <PowerOff size={16} />Desactivar
                                                    </button>
                                                ) : (
                                                    <button
                                                        type='button'
                                                        className='product-table-button'
                                                        aria-label={`Reactivar a ${account.nombre}`}
                                                        onClick={() => askAction('reactivar', account)}
                                                    >
                                                        <Power size={16} />Reactivar
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ModalPresence>
                {creating && <EmployeeForm onClose={() => setCreating(false)} onSave={handleCreate} />}
            </ModalPresence>

            <ModalPresence>
                {pending && (
                    <ConfirmDialog
                        {...dialogByAction[pending.action](pending.account)}
                        onConfirm={runAction}
                        onCancel={() => setPending(null)}
                    />
                )}
            </ModalPresence>
        </section>
    )
}

export default Employees
