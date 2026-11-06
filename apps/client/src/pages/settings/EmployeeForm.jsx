import { useEffect, useId, useState } from 'react'
import { X } from 'lucide-react'
// El marco es el de los modales de producto; los campos, los de crear cuenta
import '../../components/product-form/ProductForm.css'
import '../access/Access.css'
import PasswordField from '../access/PasswordField.jsx'
import PasswordRules from '../../components/password-rules/PasswordRules.jsx'
import { useFormulario } from '../../hooks/useFormulario.js'
import { reglasContrasena } from '../../utils/politicaContrasena.js'

const emptyEmployee = { nombre: '', correo: '', contrasena: '', confirmarContrasena: '' }

const employeeFields = {
    nombre: { obligatorio: true },
    correo: { obligatorio: true, tipo: 'correo' },
    contrasena: { obligatorio: true, ...reglasContrasena },
    confirmarContrasena: { obligatorio: true, igualA: 'contrasena', mensajeIgualA: 'Las contraseñas no coinciden.' },
}

// Los mismos límites del servidor
const MAX_NAME_LENGTH = 150
const MAX_EMAIL_LENGTH = 255

// Modal para crear la cuenta de un empleado. No llama a la API:
// usa onSave(values), que devuelve {} si se creó o { error, fields } si el servidor la rechazó.
function EmployeeForm({ onClose, onSave }) {
    const {
        valores: values, errores: errors, formularioRef, cambiarCampo, validar,
        erroresServidor, atributosCampo, idError,
    } = useFormulario(emptyEmployee, employeeFields)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const rulesId = useId()

    // No se cierra mientras guarda
    const close = () => {
        if (!saving) onClose()
    }

    useEffect(() => {
        const closeOnEscape = (event) => event.key === 'Escape' && !saving && onClose()
        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
    }, [saving, onClose])

    const setField = (key, value) => {
        cambiarCampo(key, value)
        setSaveError(null)
    }

    // Si se creó, quien abrió el modal lo cierra
    const handleSubmit = async (event) => {
        event.preventDefault()
        if (saving || !validar()) return

        setSaving(true)
        setSaveError(null)
        // La contraseña no se recorta: un espacio también cuenta como carácter
        const result = await onSave({
            nombre: values.nombre.trim(),
            correo: values.correo.trim(),
            contrasena: values.contrasena,
        })

        if (result.error) {
            setSaving(false)
            setSaveError(result.error)
            erroresServidor(result.fields)
        }
    }

    const passwordAttributes = atributosCampo('contrasena')

    return (
        <div className='product-form-overlay' onClick={close}>
            <form
                ref={formularioRef}
                noValidate
                className='product-form-modal'
                role='dialog'
                aria-modal='true'
                aria-labelledby='employee-form-title'
                onClick={(event) => event.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <header className='product-form-header'>
                    <div>
                        <h2 id='employee-form-title'>Agregar empleado</h2>
                        <p>Entregue la contraseña a la persona; después puede cambiarla desde Mi cuenta.</p>
                    </div>
                    <button type='button' className='product-form-close' aria-label='Cerrar' disabled={saving} onClick={close}>
                        <X size={20} />
                    </button>
                </header>

                <div className='access-field'>
                    <label htmlFor='employee-name'>Nombre completo</label>
                    <input
                        id='employee-name'
                        type='text'
                        autoComplete='off'
                        maxLength={MAX_NAME_LENGTH}
                        placeholder='Nombre y apellidos'
                        disabled={saving}
                        {...atributosCampo('nombre')}
                        value={values.nombre}
                        onChange={(event) => setField('nombre', event.target.value)}
                    />
                    {errors.nombre && <p id={idError('nombre')} className='access-field-error'>{errors.nombre}</p>}
                </div>

                <div className='access-field'>
                    <label htmlFor='employee-email'>Correo electrónico</label>
                    <input
                        id='employee-email'
                        type='email'
                        autoComplete='off'
                        maxLength={MAX_EMAIL_LENGTH}
                        placeholder='nombre@correo.com'
                        disabled={saving}
                        {...atributosCampo('correo')}
                        value={values.correo}
                        onChange={(event) => setField('correo', event.target.value)}
                    />
                    {errors.correo && <p id={idError('correo')} className='access-field-error'>{errors.correo}</p>}
                </div>

                <PasswordField
                    label='Contraseña'
                    value={values.contrasena}
                    onChange={(value) => setField('contrasena', value)}
                    disabled={saving}
                    inputAttributes={{
                        ...passwordAttributes,
                        'aria-describedby': [passwordAttributes['aria-describedby'], rulesId].filter(Boolean).join(' '),
                    }}
                    error={errors.contrasena}
                    errorId={idError('contrasena')}
                >
                    <PasswordRules id={rulesId} value={values.contrasena} />
                </PasswordField>

                <PasswordField
                    label='Confirmar contraseña'
                    value={values.confirmarContrasena}
                    onChange={(value) => setField('confirmarContrasena', value)}
                    disabled={saving}
                    inputAttributes={atributosCampo('confirmarContrasena')}
                    error={errors.confirmarContrasena}
                    errorId={idError('confirmarContrasena')}
                />

                {saveError && <p className='product-form-alert' role='alert'>{saveError}</p>}

                <footer className='product-form-actions'>
                    <button type='button' className='product-form-button' disabled={saving} onClick={close}>
                        Cancelar
                    </button>
                    <button type='submit' className='product-form-button product-form-button-primary' disabled={saving}>
                        {saving ? 'Creando…' : 'Crear cuenta'}
                    </button>
                </footer>
            </form>
        </div>
    )
}

export default EmployeeForm
