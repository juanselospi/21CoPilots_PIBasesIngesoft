import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Input de contraseña con el boton para mostrarla u ocultarla, igual al de iniciar sesion.
// Lo usan crear cuenta, restablecer contraseña y agregar empleado; `children` va debajo del error (por ejemplo los requisitos)
// `className` agrega clases al contenedor (por ejemplo su lugar en una cuadrícula)
function PasswordField({ label, value, onChange, disabled, inputAttributes, error, errorId, className, children }) {
    const [visible, setVisible] = useState(false)
    const inputId = useId()

    return (
        <div className={className ? `access-field ${className}` : 'access-field'}>
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

export default PasswordField
