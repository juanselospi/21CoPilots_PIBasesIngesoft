import { useId, useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, ChevronRight, ChevronUp, Eye, EyeOff, Package } from 'lucide-react'
import './MyAccount.css'
import ContactSection from './ContactSection.jsx'
import PasswordRules from '../../components/password-rules/PasswordRules.jsx'
import { obtenerMiCuenta } from '../../api/clientes.js'
import { cambiarContrasena } from '../../api/sesion.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import { useRecursoRemoto } from '../../hooks/useRecursoRemoto.js'
import { useSesion } from '../../hooks/useSesion.js'
import { reglasContrasena } from '../../utils/politicaContrasena.js'

const CLIENT_ROLE = 'cliente'

const passwordFields = {
    contrasenaActual: { obligatorio: true },
    contrasenaNueva: { obligatorio: true, ...reglasContrasena },
    confirmarContrasena: {
        obligatorio: true,
        igualA: 'contrasenaNueva',
        mensajeIgualA: 'Las contraseñas no coinciden.',
    },
}
const emptyPasswords = { contrasenaActual: '', contrasenaNueva: '', confirmarContrasena: '' }

// Pagina de Mi cuenta con los datos de la cuenta y el cambio de contraseña.
// El administrador tambien entra aqui, pero los datos de contacto y Mis pedidos son solo del cliente
function MyAccount() {
    const { usuario } = useSesion()

    return (
        <main className='my-account'>
            <h1>Mi cuenta</h1>

            {usuario.rol === CLIENT_ROLE
                ? <ClientData email={usuario.correo} />
                : <AccountData rows={[['Nombre', usuario.nombre], ['Correo electrónico', usuario.correo]]} />}

            <PasswordSection email={usuario.correo} />
        </main>
    )
}

// Datos del cliente que vienen del servidor: los de solo lectura, los de contacto y el enlace a sus pedidos
function ClientData({ email }) {
    const cuenta = useRecursoRemoto((signal) => obtenerMiCuenta({ signal }), [email])
    // Despues de guardar se usa lo que devolvio el servidor, asi no hay que volver a pedir la cuenta
    const [updated, setUpdated] = useState(null)
    const account = updated ?? cuenta.datos

    if (cuenta.cargando) {
        return <p className='my-account-card my-account-status' role='status'>Cargando tus datos…</p>
    }

    if (cuenta.error) {
        return (
            <div className='my-account-card my-account-status my-account-status-error' role='alert'>
                <p>{cuenta.error}</p>
                <button type='button' className='my-account-save' onClick={cuenta.recargar}>
                    Reintentar
                </button>
            </div>
        )
    }

    return (
        <>
            <AccountData rows={[
                ['Nombre', account.nombre],
                ['Correo electrónico', account.correo],
                ['Cédula', account.cedula],
            ]} />

            <ContactSection account={account} onSaved={setUpdated} />

            <Link to='/mis-pedidos' className='my-account-card my-account-orders'>
                <Package size={22} aria-hidden='true' />
                <span>
                    <strong>Mis pedidos</strong>
                    <span>Revisa el estado de tus compras</span>
                </span>
                <ChevronRight size={20} aria-hidden='true' />
            </Link>
        </>
    )
}

// Datos que solo se ven, `rows` es una lista de [etiqueta, valor]
function AccountData({ rows }) {
    return (
        <section className='my-account-card' aria-label='Datos de la cuenta'>
            <dl className='my-account-data'>
                {rows.map(([label, value]) => (
                    <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}

// Seccion "Contraseña", empieza cerrada y al abrirla sale el formulario para cambiarla
function PasswordSection({ email }) {
    const {
        valores, errores, formularioRef, cambiarCampo, validar,
        erroresServidor, reiniciar, atributosCampo, idError,
    } = useFormulario(emptyPasswords, passwordFields)
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [saved, setSaved] = useState(false)
    const formId = useId()
    const rulesId = useId()

    const openForm = () => {
        setSaved(false)
        setOpen(true)
    }

    const close = () => {
        reiniciar()
        setError(null)
        setOpen(false)
    }

    const setField = (campo, valor) => {
        cambiarCampo(campo, valor)
        setError(null)
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (saving || !validar()) return

        setSaving(true)
        setError(null)
        try {
            await cambiarContrasena(valores.contrasenaActual, valores.contrasenaNueva)
            reiniciar()
            setOpen(false)
            setSaved(true)
        } catch (changeError) {
            // Si la sesion vencio no hay que hacer nada mas, SessionProvider ya mando a /acceso
            setError(changeError.message)
            erroresServidor(changeError.detalles?.campos)
        }
        setSaving(false)
    }

    // Junta el id del error (si hay) con el de la lista de requisitos para aria-describedby
    const newPasswordBase = atributosCampo('contrasenaNueva')
    const newPasswordAttributes = {
        ...newPasswordBase,
        'aria-describedby': [newPasswordBase['aria-describedby'], rulesId].filter(Boolean).join(' '),
    }

    return (
        <section className='my-account-card'>
            <button
                type='button'
                className='my-account-section-toggle'
                aria-expanded={open}
                aria-controls={open ? formId : undefined}
                onClick={open ? close : openForm}
            >
                Contraseña
                {open ? <ChevronUp size={20} aria-hidden='true' /> : <ChevronDown size={20} aria-hidden='true' />}
            </button>

            {saved && <p className='my-account-saved' role='status'>Tu contraseña se actualizó.</p>}

            {open && (
                <form id={formId} ref={formularioRef} className='my-account-form' onSubmit={handleSubmit} noValidate>
                    {error && <p className='my-account-error' role='alert'>{error}</p>}

                    <PasswordField
                        label='Contraseña actual'
                        autoComplete='current-password'
                        value={valores.contrasenaActual}
                        onChange={(valor) => setField('contrasenaActual', valor)}
                        disabled={saving}
                        inputAttributes={atributosCampo('contrasenaActual')}
                        error={errores.contrasenaActual}
                        errorId={idError('contrasenaActual')}
                    />

                    <PasswordField
                        label='Nueva contraseña'
                        autoComplete='new-password'
                        value={valores.contrasenaNueva}
                        onChange={(valor) => setField('contrasenaNueva', valor)}
                        disabled={saving}
                        inputAttributes={newPasswordAttributes}
                        error={errores.contrasenaNueva}
                        errorId={idError('contrasenaNueva')}
                    >
                        <PasswordRules id={rulesId} value={valores.contrasenaNueva} />
                    </PasswordField>

                    <PasswordField
                        label='Confirmar contraseña'
                        autoComplete='new-password'
                        value={valores.confirmarContrasena}
                        onChange={(valor) => setField('confirmarContrasena', valor)}
                        disabled={saving}
                        inputAttributes={atributosCampo('confirmarContrasena')}
                        error={errores.confirmarContrasena}
                        errorId={idError('confirmarContrasena')}
                    />

                    {/* Es el mismo flujo de /acceso, el correo de la cuenta ya va lleno */}
                    <Link to='/recuperar-contrasena' state={{ correo: email }} className='my-account-link'>
                        ¿Olvidaste tu contraseña actual?
                    </Link>

                    <div className='my-account-actions'>
                        <button type='button' className='my-account-cancel' onClick={close} disabled={saving}>
                            Cancelar
                        </button>
                        <button type='submit' className='my-account-save' disabled={saving}>
                            {saving ? 'Guardando…' : 'Guardar'}
                        </button>
                    </div>
                </form>
            )}
        </section>
    )
}

// Input de contraseña con el boton para mostrarla u ocultarla, `children` va debajo del error
function PasswordField({ label, autoComplete, value, onChange, disabled, inputAttributes, error, errorId, children }) {
    const [visible, setVisible] = useState(false)
    const inputId = useId()

    return (
        <div className='my-account-field'>
            <label htmlFor={inputId}>{label}</label>
            <div className='my-account-password'>
                <input
                    id={inputId}
                    type={visible ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    {...inputAttributes}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    disabled={disabled}
                />
                <button
                    type='button'
                    className='my-account-password-toggle'
                    aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
                    aria-pressed={visible}
                    onClick={() => setVisible((shown) => !shown)}
                >
                    {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            {error && <p id={errorId} className='my-account-field-error'>{error}</p>}
            {children}
        </div>
    )
}

export default MyAccount
