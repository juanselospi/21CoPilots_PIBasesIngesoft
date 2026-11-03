import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Check, ChevronLeft } from 'lucide-react'
import './Access.css'
import { pedirEnlaceDeRecuperacion } from '../../api/sesion.js'
import { useFormulario } from '../../hooks/useFormulario.js'

const emailFields = {
    correo: { obligatorio: true, tipo: 'correo' },
}

// Pantalla para pedir el enlace de recuperacion por correo.
// El mensaje al enviar es el mismo exista o no el correo, asi no se puede averiguar quien tiene cuenta
function ForgotPassword() {
    // Si viene de /acceso con el correo escrito ya llega lleno
    const initialEmail = useLocation().state?.correo ?? ''
    const {
        valores: { correo }, errores, formularioRef, cambiarCampo,
        validar, erroresServidor, atributosCampo, idError,
    } = useFormulario({ correo: initialEmail }, emailFields)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (sending || !validar()) return

        setSending(true)
        setError(null)
        try {
            await pedirEnlaceDeRecuperacion(correo.trim())
            setSent(true)
        } catch (requestError) {
            setError(requestError.message)
            erroresServidor(requestError.detalles?.campos)
        }
        setSending(false)
    }

    const setField = (valor) => {
        cambiarCampo('correo', valor)
        setError(null)
    }

    if (sent) {
        return (
            <div className='access-form access-result' role='status'>
                <span className='access-result-icon' aria-hidden='true'><Check size={28} /></span>
                <h1>Revisa tu correo</h1>
                <p>
                    Si el correo está registrado, te llegará un enlace para crear una nueva contraseña.
                    El enlace es de un solo uso y vence.
                </p>
                <Link to='/acceso' className='access-secondary'>Volver a iniciar sesión</Link>
            </div>
        )
    }

    return (
        <form ref={formularioRef} className='access-form' onSubmit={handleSubmit} noValidate>
            <Link to='/acceso' className='access-back-link'><ChevronLeft size={16} />Volver a iniciar sesión</Link>

            <div className='access-heading'>
                <h1>Restablecer contraseña</h1>
                <p>Te enviaremos un enlace de un solo uso para crear una nueva contraseña.</p>
            </div>

            {error && <p className='access-error' role='alert'>{error}</p>}

            <label className='access-field'>
                <span>Correo electrónico</span>
                <input
                    type='email'
                    placeholder='nombre@correo.com'
                    autoComplete='email'
                    {...atributosCampo('correo')}
                    value={correo}
                    onChange={(event) => setField(event.target.value)}
                    disabled={sending}
                />
                {errores.correo && <p id={idError('correo')} className='access-field-error'>{errores.correo}</p>}
            </label>

            <button type='submit' className='access-submit' disabled={sending}>
                {sending ? 'Enviando…' : 'Enviar enlace'}
            </button>
        </form>
    )
}

export default ForgotPassword
