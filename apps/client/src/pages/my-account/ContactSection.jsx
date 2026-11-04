import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { corregirMiCuenta } from '../../api/clientes.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import {
    LIMITE_DIRECCION, MAXIMO_TELEFONOS, campoTelefono, camposDelServidor, cambiosDeContacto,
    cantidadDeTelefonos, definicionDeContacto, valoresDeContacto,
} from '../../utils/datosDeContacto.js'

// Seccion "Datos de contacto" del cliente. Cerrada muestra la direccion y los telefonos,
// al abrirla salen para editarlos. `onSaved` recibe la cuenta como la devolvio el servidor
function ContactSection({ account, onSaved }) {
    const [phones, setPhones] = useState(() => cantidadDeTelefonos(account))
    const {
        valores, errores, formularioRef, cambiarCampo, validar,
        erroresServidor, reiniciar, atributosCampo, idError,
    } = useFormulario(valoresDeContacto(account), definicionDeContacto(phones))
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [saved, setSaved] = useState(false)
    const focusNewPhone = useRef(false)
    const formId = useId()

    // Al agregar un telefono el cursor se va al campo nuevo
    useEffect(() => {
        if (!focusNewPhone.current) return
        focusNewPhone.current = false
        formularioRef.current?.elements[campoTelefono(phones - 1)]?.focus()
    }, [phones, formularioRef])

    // Deja el formulario igual que la cuenta, sirve al cancelar y despues de guardar
    const resetTo = (cuenta) => {
        reiniciar(valoresDeContacto(cuenta))
        setPhones(cantidadDeTelefonos(cuenta))
    }

    const openForm = () => {
        setSaved(false)
        setOpen(true)
    }

    const close = () => {
        resetTo(account)
        setError(null)
        setOpen(false)
    }

    const setField = (campo, valor) => {
        cambiarCampo(campo, valor)
        setError(null)
    }

    const addPhone = () => {
        focusNewPhone.current = true
        setPhones((cantidad) => cantidad + 1)
    }

    // Los de abajo suben un lugar y el ultimo queda vacio por si se vuelve a agregar
    const removePhone = (indice) => {
        for (let i = indice; i < phones - 1; i++) {
            cambiarCampo(campoTelefono(i), valores[campoTelefono(i + 1)])
        }
        cambiarCampo(campoTelefono(phones - 1), '')
        setPhones((cantidad) => cantidad - 1)
        setError(null)
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (saving || !validar()) return

        // Si no cambio nada no hace falta ir al servidor, simplemente se cierra
        const cambios = cambiosDeContacto(valores, phones, account)
        if (Object.keys(cambios).length === 0) {
            close()
            return
        }

        setSaving(true)
        setError(null)
        try {
            const updated = await corregirMiCuenta(cambios)
            onSaved(updated)
            resetTo(updated)
            setOpen(false)
            setSaved(true)
        } catch (saveError) {
            setError(saveError.message)
            erroresServidor(camposDelServidor(saveError.detalles?.campos))
        }
        setSaving(false)
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
                Datos de contacto
                {open ? <ChevronUp size={20} aria-hidden='true' /> : <ChevronDown size={20} aria-hidden='true' />}
            </button>

            {saved && <p className='my-account-saved' role='status'>Tus datos de contacto se actualizaron.</p>}

            {!open && (
                <dl className='my-account-data'>
                    <div>
                        <dt>Dirección</dt>
                        <dd>{account.direccion}</dd>
                    </div>
                    <div>
                        <dt>{account.telefonos.length > 1 ? 'Teléfonos' : 'Teléfono'}</dt>
                        <dd>{account.telefonos.join(', ') || 'Sin teléfono'}</dd>
                    </div>
                </dl>
            )}

            {open && (
                <form id={formId} ref={formularioRef} className='my-account-form' onSubmit={handleSubmit} noValidate>
                    {error && <p className='my-account-error' role='alert'>{error}</p>}

                    <ContactField
                        label='Dirección'
                        multiline
                        value={valores.direccion}
                        onChange={(valor) => setField('direccion', valor)}
                        disabled={saving}
                        inputAttributes={{
                            ...atributosCampo('direccion'),
                            autoComplete: 'street-address',
                            maxLength: LIMITE_DIRECCION,
                            placeholder: 'Provincia, cantón, distrito y otras señas',
                        }}
                        error={errores.direccion}
                        errorId={idError('direccion')}
                    />

                    {Array.from({ length: phones }, (_, i) => {
                        const campo = campoTelefono(i)
                        const label = phones > 1 ? `Teléfono ${i + 1}` : 'Teléfono'
                        return (
                            <ContactField
                                key={campo}
                                label={label}
                                value={valores[campo]}
                                onChange={(valor) => setField(campo, valor)}
                                disabled={saving}
                                inputAttributes={{
                                    ...atributosCampo(campo),
                                    type: 'tel',
                                    autoComplete: i === 0 ? 'tel' : 'off',
                                    placeholder: '8888-8888',
                                }}
                                error={errores[campo]}
                                errorId={idError(campo)}
                                // Siempre tiene que quedar al menos un telefono
                                onRemove={phones > 1 ? () => removePhone(i) : undefined}
                            />
                        )
                    })}

                    {phones < MAXIMO_TELEFONOS && (
                        <button type='button' className='my-account-link my-account-add' onClick={addPhone} disabled={saving}>
                            <Plus size={16} aria-hidden='true' />
                            Agregar teléfono
                        </button>
                    )}

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

// Input de texto (o textarea con `multiline`), con el boton de quitar a la par si viene `onRemove`
function ContactField({ label, multiline, value, onChange, disabled, inputAttributes, error, errorId, onRemove }) {
    const inputId = useId()
    const Input = multiline ? 'textarea' : 'input'

    return (
        <div className='my-account-field'>
            <label htmlFor={inputId}>{label}</label>
            <div className='my-account-input'>
                <Input
                    id={inputId}
                    rows={multiline ? 3 : undefined}
                    {...inputAttributes}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    disabled={disabled}
                />
                {onRemove && (
                    <button
                        type='button'
                        className='my-account-remove'
                        aria-label={`Quitar ${label.toLowerCase()}`}
                        onClick={onRemove}
                        disabled={disabled}
                    >
                        <Trash2 size={18} aria-hidden='true' />
                    </button>
                )}
            </div>
            {error && <p id={errorId} className='my-account-field-error'>{error}</p>}
        </div>
    )
}

export default ContactSection
