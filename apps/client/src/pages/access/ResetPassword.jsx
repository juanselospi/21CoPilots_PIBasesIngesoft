import { useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Check, Eye, EyeOff, X } from 'lucide-react'
import './Access.css'
import PasswordRules from '../../components/password-rules/PasswordRules.jsx'
import { restablecerContrasena } from '../../api/sesion.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import { reglasContrasena } from '../../utils/politicaContrasena.js'

const INVALID_TOKEN = 'TOKEN_INVALIDO'
const resetFields = {
    contrasenaNueva: { obligatorio: true, ...reglasContrasena },
    confirmarContrasena: {
        obligatorio: true,
        igualA: 'contrasenaNueva',
        mensajeIgualA: 'Las contraseñas no coinciden.',
    },
}

// Pantalla a la que lleva el enlace del correo: /restablecer?token=...
// El token solo se revisa al guardar, si no sirve se muestra el aviso para pedir otro enlace
function ResetPassword() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    // 'form' mientras se llena, 'done' si se cambio y 'invalid' si el enlace no sirve o no trae token
    const [status, setStatus] = useState(token ? 'form' : 'invalid')

    if (status === 'done') {
        return (
            <div className='access-form access-result' role='status'>
                <span className='access-result-icon' aria-hidden='true'><Check size={28} /></span>
                <h1>Tu contraseña se actualizó</h1>
                <p>Ya puedes iniciar sesión con la contraseña nueva.</p>
                <Link to='/acceso' className='access-submit'>Iniciar sesión</Link>
            </div>
        )
    }

    if (status === 'invalid') {
        return (
            <div className='access-form access-result' role='alert'>
                <span className='access-result-icon access-result-icon-error' aria-hidden='true'><X size={28} /></span>
                <h1>El enlace no sirve</h1>
                <p>El enlace no es válido o ya venció. Cada enlace se puede usar una sola vez, pide uno nuevo.</p>
                <Link to='/recuperar-contrasena' className='access-submit'>Pedir otro enlace</Link>
                <Link to='/acceso' className='access-secondary'>Volver a iniciar sesión</Link>
            </div>
        )
    }

    return <ResetForm token={token} onDone={() => setStatus('done')} onInvalidToken={() => setStatus('invalid')} />
}

function ResetForm({ token, onDone, onInvalidToken }) {
    const {
        valores, errores, formularioRef, cambiarCampo, validar,
        erroresServidor, atributosCampo, idError,
    } = useFormulario({ contrasenaNueva: '', confirmarContrasena: '' }, resetFields)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)
    const rulesId = useId()

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (sending || !validar()) return

        setSending(true)
        setError(null)
        try {
            await restablecerContrasena(token, valores.contrasenaNueva)
            onDone()
        } catch (resetError) {
            if (resetError.codigo === INVALID_TOKEN) {
                onInvalidToken()
                return
            }
            setError(resetError.message)
            erroresServidor(resetError.detalles?.campos)
            setSending(false)
        }
    }

    const setField = (campo, valor) => {
        cambiarCampo(campo, valor)
        setError(null)
    }

    // Junta el id del error (si hay) con el de la lista de requisitos para aria-describedby
    const newPasswordBase = atributosCampo('contrasenaNueva')
    const newPasswordAttributes = {
        ...newPasswordBase,
        'aria-describedby': [newPasswordBase['aria-describedby'], rulesId].filter(Boolean).join(' '),
    }

    return (
        <form ref={formularioRef} className='access-form' onSubmit={handleSubmit} noValidate>
            <div className='access-heading'>
                <h1>Nueva contraseña</h1>
                <p>Escribe la contraseña nueva para tu cuenta.</p>
            </div>

            {error && <p className='access-error' role='alert'>{error}</p>}

            <PasswordField
                label='Nueva contraseña'
                value={valores.contrasenaNueva}
                onChange={(valor) => setField('contrasenaNueva', valor)}
                disabled={sending}
                inputAttributes={newPasswordAttributes}
                error={errores.contrasenaNueva}
                errorId={idError('contrasenaNueva')}
            >
                <PasswordRules id={rulesId} value={valores.contrasenaNueva} />
            </PasswordField>

            <PasswordField
                label='Confirmar contraseña'
                value={valores.confirmarContrasena}
                onChange={(valor) => setField('confirmarContrasena', valor)}
                disabled={sending}
                inputAttributes={atributosCampo('confirmarContrasena')}
                error={errores.confirmarContrasena}
                errorId={idError('confirmarContrasena')}
            />

            <button type='submit' className='access-submit' disabled={sending}>
                {sending ? 'Guardando…' : 'Guardar contraseña'}
            </button>
        </form>
    )
}

// Input de contraseña con el boton para mostrarla u ocultarla, igual al de iniciar sesion
function PasswordField({ label, value, onChange, disabled, inputAttributes, error, errorId, children }) {
    const [visible, setVisible] = useState(false)
    const inputId = useId()

    return (
        <div className='access-field'>
            <label htmlFor={inputId}>{label}</label>
            <div className='access-password'>
                <input
                    id={inputId}
                    type={visible ? 'text' : 'password'}
                    autoComplete='new-password'
                    {...inputAttributes}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    disabled={disabled}
                />
                <button
                    type='button'
                    className='access-password-toggle'
                    aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
                    aria-pressed={visible}
                    onClick={() => setVisible((shown) => !shown)}
                >
                    {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            {error && <p id={errorId} className='access-field-error'>{error}</p>}
            {children}
        </div>
    )
}

export default ResetPassword
