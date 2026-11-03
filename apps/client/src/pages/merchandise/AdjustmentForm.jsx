import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useFormulario } from '../../hooks/useFormulario.js'
import { signedUnitsText, unitsText } from './merchandiseFormat.js'

const rules = {
    cantidad: {
        obligatorio: true,
        tipo: 'entero',
        patron: '^-?[1-9]\\d*$',
        mensajePatron: 'Use un entero distinto de 0: positivo suma y negativo resta.',
    },
    motivo: { obligatorio: true },
}

// Solo dígitos, con un signo negativo opcional al inicio
const readSignedInput = (input) => (/^-?\d*$/.test(input) ? input : null)

// Ajuste de existencias (RF-20): suma o resta unidades y siempre lleva motivo.
// No llama a la API: usa onRegister(values), que devuelve { movement } o { error, fields }.
function AdjustmentForm({ onRegister }) {
    const {
        valores: values, errores: errors, formularioRef, cambiarCampo, validar,
        erroresServidor, reiniciar, atributosCampo, idError,
    } = useFormulario({ cantidad: '', motivo: '' }, rules)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [registered, setRegistered] = useState(null)

    const setField = (key, value) => {
        if (value === null) return
        cambiarCampo(key, value)
        setSaveError(null)
        setRegistered(null)
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (saving || !validar()) return

        setSaving(true)
        setSaveError(null)
        const result = await onRegister({ cantidad: values.cantidad, motivo: values.motivo.trim() })
        setSaving(false)

        if (result.error) {
            setSaveError(result.error)
            erroresServidor(result.fields)
        } else {
            setRegistered(result.movement)
            reiniciar({ cantidad: '', motivo: '' })
        }
    }

    const fieldError = (key) => errors[key] && <p id={idError(key)} className='product-form-error'>{errors[key]}</p>

    return (
        <form ref={formularioRef} noValidate className='merchandise-card' aria-label='Ajuste de existencias' onSubmit={handleSubmit}>
            <p className='merchandise-help'>Corrige las existencias (conteo, daño, pérdida). Positivo suma y negativo resta.</p>

            <div className='merchandise-fields'>
                <label className='product-form-field'>
                    <span>Cantidad</span>
                    <div className='product-form-input'>
                        <input
                            type='text'
                            inputMode='numeric'
                            disabled={saving}
                            placeholder='Ej. -2'
                            {...atributosCampo('cantidad')}
                            value={values.cantidad}
                            onChange={(event) => setField('cantidad', readSignedInput(event.target.value))}
                        />
                        <span>unidades</span>
                    </div>
                    {fieldError('cantidad')}
                </label>

                <label className='product-form-field'>
                    <span>Motivo</span>
                    <div className='product-form-input'>
                        <input
                            type='text'
                            disabled={saving}
                            placeholder='Ej. Unidad dañada en bodega'
                            maxLength={500}
                            {...atributosCampo('motivo')}
                            value={values.motivo}
                            onChange={(event) => setField('motivo', event.target.value)}
                        />
                    </div>
                    {fieldError('motivo')}
                </label>
            </div>

            {saveError && <p className='product-form-alert' role='alert'>{saveError}</p>}
            {registered && (
                <p className='product-form-success' role='status'>
                    Ajuste de {signedUnitsText(registered.cantidad)} registrado. Quedan {unitsText(registered.existencias)}.
                </p>
            )}

            <button type='submit' className='products-button' disabled={saving}>
                <SlidersHorizontal size={18} />{saving ? 'Registrando…' : 'Registrar ajuste'}
            </button>
        </form>
    )
}

export default AdjustmentForm
