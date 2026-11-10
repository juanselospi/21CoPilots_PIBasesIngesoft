import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronRight } from 'lucide-react'
import PasswordField from './PasswordField.jsx'
import PasswordRules from '../../components/password-rules/PasswordRules.jsx'
import { registrarCliente } from '../../api/clientes.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import { useSesion } from '../../hooks/useSesion.js'
import { reglasContrasena } from '../../utils/politicaContrasena.js'
import { reglasCedula, reglasTelefono } from '../../utils/reglasCliente.js'

const DUPLICATED = 409
const signUpFields = {
    nombre: { obligatorio: true },
    correo: { obligatorio: true, tipo: 'correo' },
    contrasena: { obligatorio: true, ...reglasContrasena },
    confirmarContrasena: {
        obligatorio: true,
        igualA: 'contrasena',
        mensajeIgualA: 'Las contraseñas no coinciden.',
    },
    telefono: { obligatorio: true, ...reglasTelefono },
    cedula: { obligatorio: true, ...reglasCedula },
    direccion: { obligatorio: true },
    aceptaTerminos: {
        obligatorio: true,
        tipo: 'casilla',
        mensajeCasilla: 'Debe aceptar los términos y condiciones.',
    },
}
const emptySignUp = {
    nombre: '', correo: '', contrasena: '', confirmarContrasena: '',
    telefono: '', cedula: '', direccion: '', aceptaTerminos: false,
}

// Junta el aria-describedby del error (si hay) con el de la ayuda o la lista que va debajo del campo
const withDescription = (atributos, id) => ({
    ...atributos,
    'aria-describedby': [atributos['aria-describedby'], id].filter(Boolean).join(' '),
})

// Pestaña "Crear cuenta" de /acceso. Todos los campos son obligatorios y al enviar se marcan todos los errores a la vez.
// Al registrarse queda con sesion y regresa a `backTo` (si venia del checkout) o a la tienda
function SignUpForm({ backTo, onLogIn }) {
    const navigate = useNavigate()
    const { recargar: reloadSession } = useSesion()
    const {
        valores, errores, formularioRef, cambiarCampo, validar,
        erroresServidor, atributosCampo, idError,
    } = useFormulario(emptySignUp, signUpFields)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)
    const rulesId = useId()
    const termsId = useId()

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (sending || !validar()) return

        setSending(true)
        setError(null)
        try {
            await registrarCliente({
                nombre: valores.nombre.trim(),
                correo: valores.correo.trim(),
                contrasena: valores.contrasena,
                cedula: valores.cedula.trim(),
                telefono: valores.telefono.trim(),
                direccion: valores.direccion.trim(),
            })
            reloadSession()
            navigate(backTo ?? '/', { replace: true })
        } catch (signUpError) {
            const campos = signUpError.detalles?.campos
            // Correo o cedula que ya tienen cuenta: el mensaje del servidor va en el mismo campo
            if (signUpError.estado === DUPLICATED && campos?.length) {
                erroresServidor(campos, signUpError.message)
            } else {
                setError(signUpError.message)
                erroresServidor(campos)
            }
            setSending(false)
        }
    }

    const setField = (campo, valor) => {
        cambiarCampo(campo, valor)
        setError(null)
    }

    // Los inputs de texto comunes, el de contraseña y la casilla van aparte.
    // El error queda fuera del label para que no se lea como parte del nombre del campo.
    // Cada campo lleva su área en la cuadrícula (access-area-<campo>, en Access.css).
    // `hint` es una ayuda debajo del input, ligada por aria-describedby.
    const textField = (campo, label, { type = 'text', autoComplete, inputMode, placeholder, hint, ...extra } = {}) => {
        const atributos = atributosCampo(campo)
        const inputId = `${idError(campo)}-input`
        const hintId = `${inputId}-ayuda`
        return (
            <div className={`access-field access-area-${campo}`}>
                <label htmlFor={inputId}>{label}</label>
                <input
                    id={inputId}
                    type={type}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    placeholder={placeholder}
                    {...extra}
                    {...(hint ? withDescription(atributos, hintId) : atributos)}
                    value={valores[campo]}
                    onChange={(event) => setField(campo, event.target.value)}
                    disabled={sending}
                />
                {errores[campo] && <p id={idError(campo)} className='access-field-error'>{errores[campo]}</p>}
                {hint && <p id={hintId} className='access-hint'>{hint}</p>}
            </div>
        )
    }

    return (
        <form ref={formularioRef} className='access-form access-form-wide' onSubmit={handleSubmit} noValidate>
            <div className='access-heading'>
                <h1>Crear cuenta</h1>
                <p>Empiezas en nivel 1. Con cada compra subes de nivel y obtienes descuentos.</p>
            </div>

            {/* Dos columnas en escritorio y una en celular (Access.css). Los requisitos van
                después de «Contraseña» para que en celular queden pegados a ella; en escritorio
                la cuadrícula los pasa debajo de las dos contraseñas */}
            <div className='access-signup-grid'>
                {textField('nombre', 'Nombre completo', {
                    autoComplete: 'name', autoCapitalize: 'words', placeholder: 'Nombre y apellidos',
                })}
                {textField('correo', 'Correo electrónico', {
                    type: 'email', autoComplete: 'email', autoCapitalize: 'none', spellCheck: false,
                    placeholder: 'nombre@correo.com',
                })}

                <PasswordField
                    className='access-area-contrasena'
                    label='Contraseña'
                    value={valores.contrasena}
                    onChange={(valor) => setField('contrasena', valor)}
                    disabled={sending}
                    inputAttributes={withDescription(atributosCampo('contrasena'), rulesId)}
                    error={errores.contrasena}
                    errorId={idError('contrasena')}
                />

                <div id={rulesId} className='access-password-rules access-area-requisitos'>
                    <span>La contraseña debe incluir:</span>
                    <PasswordRules value={valores.contrasena} compact />
                </div>

                <PasswordField
                    className='access-area-confirmar'
                    label='Confirmar contraseña'
                    value={valores.confirmarContrasena}
                    onChange={(valor) => setField('confirmarContrasena', valor)}
                    disabled={sending}
                    inputAttributes={atributosCampo('confirmarContrasena')}
                    error={errores.confirmarContrasena}
                    errorId={idError('confirmarContrasena')}
                />

                {textField('telefono', 'Teléfono', { type: 'tel', autoComplete: 'tel', placeholder: '8888-8888' })}
                {textField('cedula', 'Cédula', {
                    inputMode: 'numeric', autoComplete: 'off', placeholder: '0-0000-0000',
                    hint: 'La cédula se necesita para la factura.',
                })}

                {textField('direccion', 'Dirección', {
                    autoComplete: 'street-address',
                    placeholder: 'Provincia, cantón, distrito y otras señas',
                })}
            </div>

            <div className='access-terms'>
                <label className='access-checkbox'>
                    <input
                        type='checkbox'
                        {...withDescription(atributosCampo('aceptaTerminos'), termsId)}
                        checked={valores.aceptaTerminos}
                        onChange={(event) => setField('aceptaTerminos', event.target.checked)}
                        disabled={sending}
                    />
                    <span>Acepto los términos y condiciones</span>
                </label>
                {errores.aceptaTerminos && (
                    <p id={idError('aceptaTerminos')} className='access-field-error'>{errores.aceptaTerminos}</p>
                )}
                {/* Texto provisional hasta que el cliente mande los terminos de verdad */}
                <details id={termsId} className='access-terms-text'>
                    <summary>Ver términos y condiciones</summary>
                    <p>
                        Texto provisional. Al crear la cuenta aceptas que DC Hobbies guarde tu nombre, correo,
                        teléfono, dirección y cédula para procesar tus pedidos, hacer las entregas y emitir la
                        factura. Tus datos no se comparten con terceros y puedes pedir que se corrijan cuando
                        quieras, según la Ley 8968 de protección de datos personales.
                    </p>
                </details>
            </div>

            {/* Junto al botón: al enviar, la vista está aquí y no arriba del formulario */}
            {error && <p className='access-error' role='alert'>{error}</p>}

            <button type='submit' className='access-submit' disabled={sending}>
                {sending ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>

            <div className='access-footer'>
                <p>
                    ¿Ya tienes cuenta?{' '}
                    <button type='button' className='access-link' onClick={onLogIn}>
                        Inicia sesión<ChevronRight size={16} />
                    </button>
                </p>
            </div>
        </form>
    )
}

export default SignUpForm
