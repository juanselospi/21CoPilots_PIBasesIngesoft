import { useId, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { ChevronRight, Eye, EyeOff } from 'lucide-react'
import './Access.css'
import SignUpForm from './SignUpForm.jsx'
import { logIn } from '../../api/sesion.js'
import { useSesion } from '../../hooks/useSesion.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import { rutaDeVuelta } from '../../utils/rutaDeVuelta.js'

const ADMIN_ROLE = 'administrador'
const SIGN_UP_TAB = 'crear-cuenta'
const loginFields = {
    correo: { obligatorio: true, tipo: 'correo' },
    contrasena: { obligatorio: true },
}

// La barra de arriba y la tarjeta las pone AccessLayout.
// La pestaña va en la URL (?pestana=crear-cuenta) para que el checkout pueda mandar directo a crear la cuenta,
// y ?volver= dice a donde regresar despues de entrar
function Access() {
    const [searchParams, setSearchParams] = useSearchParams()
    const signingUp = searchParams.get('pestana') === SIGN_UP_TAB
    const backTo = rutaDeVuelta(searchParams.get('volver'))
    const logInTabId = useId()
    const signUpTabId = useId()
    const panelId = useId()

    // Cambia de pestaña sin perder el ?volver=
    const showTab = (signUp) => {
        setSearchParams((actuales) => {
            const siguientes = new URLSearchParams(actuales)
            if (signUp) siguientes.set('pestana', SIGN_UP_TAB)
            else siguientes.delete('pestana')
            return siguientes
        }, { replace: true })
    }

    return (
        <>
            <div className='access-tabs' role='tablist'>
                <button
                    type='button'
                    role='tab'
                    id={logInTabId}
                    aria-selected={!signingUp}
                    aria-controls={panelId}
                    className={signingUp ? 'access-tab' : 'access-tab access-tab-active'}
                    onClick={() => showTab(false)}
                >
                    Iniciar sesión
                </button>
                <button
                    type='button'
                    role='tab'
                    id={signUpTabId}
                    aria-selected={signingUp}
                    aria-controls={panelId}
                    className={signingUp ? 'access-tab access-tab-active' : 'access-tab'}
                    onClick={() => showTab(true)}
                >
                    Crear cuenta
                </button>
            </div>

            <div id={panelId} role='tabpanel' aria-labelledby={signingUp ? signUpTabId : logInTabId}>
                {signingUp
                    ? <SignUpForm backTo={backTo} onLogIn={() => showTab(false)} />
                    : <LogInForm backTo={backTo} onSignUp={() => showTab(true)} />}
            </div>
        </>
    )
}

function LogInForm({ backTo, onSignUp }) {
    const navigate = useNavigate()
    // Si se llega aqui porque la sesion vencio, SessionProvider manda el aviso en el state
    const notice = useLocation().state?.aviso
    const { recargar: reloadSession } = useSesion()
    const {
        valores: { correo, contrasena }, errores, formularioRef, cambiarCampo,
        validar, erroresServidor, atributosCampo, idError,
    } = useFormulario({ correo: '', contrasena: '' }, loginFields)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState(null)
    const [sending, setSending] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (sending || !validar()) return

        setSending(true)
        setError(null)
        try {
            const usuario = await logIn(correo.trim(), contrasena)
            reloadSession()
            // El administrador siempre va al panel, el cliente regresa a donde venia (por ejemplo el checkout)
            navigate(usuario.rol === ADMIN_ROLE ? '/admin/productos' : (backTo ?? '/'), { replace: true })
        } catch (logInError) {
            setError(logInError.message)
            erroresServidor(logInError.detalles?.campos)
            setSending(false)
        }
    }

    const setField = (campo, valor) => {
        cambiarCampo(campo, valor)
        setError(null)
    }

    return (
        <form ref={formularioRef} className='access-form' onSubmit={handleSubmit} noValidate>
            <div className='access-heading'>
                <h1>Bienvenido de vuelta</h1>
                <p>Inicia sesión para dar seguimiento a tus pedidos.</p>
            </div>

            {notice && !error && <p className='access-notice' role='status'>{notice}</p>}
            {error && <p className='access-error' role='alert'>{error}</p>}

            <label className='access-field'>
                <span>Correo electrónico</span>
                <input
                    type='email'
                    placeholder='nombre@correo.com'
                    autoComplete='email'
                    {...atributosCampo('correo')}
                    value={correo}
                    onChange={(event) => setField('correo', event.target.value)}
                    disabled={sending}
                />
                {errores.correo && <p id={idError('correo')} className='access-field-error'>{errores.correo}</p>}
            </label>

            <div className='access-field'>
                <div className='access-field-label'>
                    <label htmlFor='access-password'>Contraseña</label>
                    {/* Si ya escribio el correo se lo pasamos para que no lo tenga que escribir otra vez */}
                    <Link to='/recuperar-contrasena' state={{ correo: correo.trim() }} className='access-link'>
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
                <div className='access-password'>
                    <input
                        id='access-password'
                        type={showPassword ? 'text' : 'password'}
                        autoComplete='current-password'
                        value={contrasena}
                        onChange={(event) => setField('contrasena', event.target.value)}
                        {...atributosCampo('contrasena')}
                        disabled={sending}
                    />
                    <button
                        type='button'
                        className='access-password-toggle'
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((visible) => !visible)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                {errores.contrasena && <p id={idError('contrasena')} className='access-field-error'>{errores.contrasena}</p>}
            </div>

            <button type='submit' className='access-submit' disabled={sending}>
                {sending ? 'Ingresando…' : 'Iniciar sesión'}
            </button>

            <div className='access-footer'>
                <p>
                    ¿Primera vez aquí?{' '}
                    <button type='button' className='access-link' onClick={onSignUp}>
                        Crear cuenta<ChevronRight size={16} />
                    </button>
                </p>
                <p className='access-note'>Tu carrito se conserva al iniciar sesión.</p>
            </div>
        </form>
    )
}

export default Access
