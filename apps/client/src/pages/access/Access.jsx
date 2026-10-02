import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import './Access.css'
import { logIn } from '../../api/sesion.js'
import { useSesion } from '../../hooks/useSesion.js'

const ADMIN_ROLE = 'administrador'

// Sub-pantalla de acceso (wireframe 01a). Por ahora solo funciona
// "Iniciar sesión": "Crear cuenta" espera la respuesta del cliente y la
// recuperación de contraseña (RF-54) es del Sprint 2.
function Access() {
    return (
        <div className='access'>
            <header className='access-topbar'>
                <Link to='/' className='access-logo'>LOGO</Link>
                <Link to='/' className='access-back'>‹ Volver a la tienda</Link>
                <a href='#' className='access-cart'>Carrito (0)</a>
            </header>

            <main className='access-main'>
                <section className='access-card'>
                    <div className='access-tabs' role='tablist'>
                        <button type='button' role='tab' aria-selected='true' className='access-tab access-tab-active'>
                            Iniciar sesión
                        </button>
                        <button type='button' role='tab' aria-selected='false' className='access-tab' disabled>
                            Crear cuenta
                        </button>
                    </div>

                    <LogInForm />
                </section>
            </main>
        </div>
    )
}

function LogInForm() {
    const navigate = useNavigate()
    const { recargar: reloadSession } = useSesion()
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState(null)
    const [sending, setSending] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (!correo.trim() || !contrasena) {
            setError('Escriba su correo y contraseña.')
            return
        }

        setSending(true)
        setError(null)
        try {
            const usuario = await logIn(correo.trim(), contrasena)
            reloadSession()
            navigate(usuario.rol === ADMIN_ROLE ? '/admin/productos' : '/', { replace: true })
        } catch (logInError) {
            setError(logInError.message)
            setSending(false)
        }
    }

    return (
        <form className='access-form' onSubmit={handleSubmit} noValidate>
            <div className='access-heading'>
                <h1>Bienvenido de vuelta</h1>
                <p>Inicia sesión para dar seguimiento a tus pedidos.</p>
            </div>

            {error && <p className='access-error' role='alert'>{error}</p>}

            <label className='access-field'>
                <span>Correo electrónico</span>
                <input
                    type='email'
                    placeholder='nombre@correo.com'
                    autoComplete='email'
                    value={correo}
                    onChange={(event) => setCorreo(event.target.value)}
                    disabled={sending}
                />
            </label>

            <div className='access-field'>
                <div className='access-field-label'>
                    <label htmlFor='access-password'>Contraseña</label>
                    <button type='button' className='access-link' disabled title='Disponible próximamente'>
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>
                <div className='access-password'>
                    <input
                        id='access-password'
                        type={showPassword ? 'text' : 'password'}
                        autoComplete='current-password'
                        value={contrasena}
                        onChange={(event) => setContrasena(event.target.value)}
                        aria-invalid={Boolean(error)}
                        disabled={sending}
                    />
                    <button
                        type='button'
                        className='access-password-toggle'
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((visible) => !visible)}
                    >
                        <svg viewBox='0 0 24 24' width='20' height='20' aria-hidden='true'>
                            <path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z' />
                            <circle cx='12' cy='12' r='3' />
                            {showPassword && <path d='M4 4l16 16' />}
                        </svg>
                    </button>
                </div>
            </div>

            <button type='submit' className='access-submit' disabled={sending}>
                {sending ? 'Ingresando…' : 'Iniciar sesión'}
            </button>

            <div className='access-footer'>
                <p>
                    ¿Primera vez aquí?{' '}
                    <button type='button' className='access-link' disabled title='Disponible próximamente'>
                        Crear cuenta →
                    </button>
                </p>
                <p className='access-note'>Tu carrito se conserva al iniciar sesión.</p>
            </div>
        </form>
    )
}

export default Access
