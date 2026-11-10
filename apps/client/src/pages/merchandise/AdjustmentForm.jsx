import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { readStockInput } from '../../components/product-form/stockInput.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import Notice from '../../components/notice/Notice.jsx'
import { adjustmentModes, signedUnitsText, unitsText } from './merchandiseFormat.js'
import InputUnit from '../../components/input-unit/InputUnit.jsx'

// «Dejar en» acepta 0 (se acabó todo); sumar y restar piden al menos una unidad
const rulesFor = (mode) => ({
    cantidad: mode === 'fijar'
        ? { obligatorio: true, tipo: 'entero', minimo: 0 }
        : { obligatorio: true, tipo: 'entero', minimo: 1, mensajeMinimo: 'La cantidad tiene que ser mayor que 0.' },
    motivo: { obligatorio: true },
})

// Cantidad entera de 0 o más, o null mientras no lo sea
const wholeNumber = (text) => (/^\d+$/.test(text) ? Number(text) : null)

// Lo que no se puede mandar aunque los campos estén bien
const problemWith = (mode, quantity, stock) => {
    if (mode === 'restar' && quantity > stock) return `Solo hay ${unitsText(stock)}; no se pueden restar ${quantity}.`
    if (mode === 'fijar' && quantity === stock) return `Ya tiene ${unitsText(stock)}; no hay nada que ajustar.`
    return null
}

// Ajuste de existencias (RF-20): sumar, restar o dejar una cantidad exacta, siempre con motivo.
// No llama a la API: usa onRegister(values), que devuelve { movement } o { error, fields }.
// onPreview(existencias) le dice a la página cuántas quedarían, o null si todavía no se sabe.
function AdjustmentForm({ product, onRegister, onPreview }) {
    const [mode, setMode] = useState('restar')
    const {
        valores: values, errores: errors, formularioRef, cambiarCampo, validar,
        erroresServidor, reiniciar, atributosCampo, idError,
    } = useFormulario({ cantidad: '', motivo: '' }, rulesFor(mode))
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [registered, setRegistered] = useState(null)
    const { quantityLabel, reasonPlaceholder, toChange } = adjustmentModes[mode]

    const preview = (nextMode, text) => {
        const quantity = wholeNumber(text)
        onPreview(quantity === null ? null : product.stock + adjustmentModes[nextMode].toChange(quantity, product.stock))
    }

    const setField = (key, value) => {
        if (value === null) return
        cambiarCampo(key, value)
        setSaveError(null)
        setRegistered(null)
        if (key === 'cantidad') preview(mode, value)
    }

    const changeMode = (nextMode) => {
        setMode(nextMode)
        setSaveError(null)
        setRegistered(null)
        // Limpia el error de la cantidad del modo anterior
        cambiarCampo('cantidad', values.cantidad)
        preview(nextMode, values.cantidad)
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (saving || !validar()) return

        const quantity = Number(values.cantidad)
        const problem = problemWith(mode, quantity, product.stock)
        if (problem) {
            setSaveError(problem)
            erroresServidor(['cantidad'])
            return
        }

        setSaving(true)
        setSaveError(null)
        // «Dejar en» se manda como la diferencia con las existencias que se ven en pantalla;
        // si alguien vendió mientras tanto, el servidor igual impide quedar en negativo
        const result = await onRegister({ cantidad: toChange(quantity, product.stock), motivo: values.motivo.trim() })
        setSaving(false)

        if (result.error) {
            setSaveError(result.error)
            erroresServidor(result.fields)
        } else {
            setRegistered(result.movement)
            reiniciar({ cantidad: '', motivo: '' })
            onPreview(null)
        }
    }

    const fieldError = (key) => errors[key] && <p id={idError(key)} className='product-form-error'>{errors[key]}</p>

    return (
        <form ref={formularioRef} noValidate className='merchandise-card' aria-label='Ajuste de existencias' onSubmit={handleSubmit}>
            <p className='merchandise-help'>Corrige las existencias sin una compra: un conteo, un daño o una pérdida. Siempre lleva motivo.</p>

            <fieldset className='merchandise-modes'>
                <legend>Tipo de ajuste</legend>
                {Object.entries(adjustmentModes).map(([key, { label }]) => (
                    <label key={key} className='product-form-check'>
                        <input
                            type='radio'
                            name='modo-de-ajuste'
                            disabled={saving}
                            checked={mode === key}
                            onChange={() => changeMode(key)}
                        />
                        <span>{label}</span>
                    </label>
                ))}
            </fieldset>

            <div className='merchandise-fields'>
                <label className='product-form-field'>
                    <span>{quantityLabel}</span>
                    <div className='product-form-input'>
                        <input
                            type='text'
                            inputMode='numeric'
                            disabled={saving}
                            placeholder={mode === 'fijar' ? `Hoy: ${product.stock}` : 'Ej. 2'}
                            {...atributosCampo('cantidad')}
                            value={values.cantidad}
                            onChange={(event) => setField('cantidad', readStockInput(event.target.value))}
                        />
                        <InputUnit unit='unidades' />
                    </div>
                    {fieldError('cantidad')}
                </label>

                <label className='product-form-field'>
                    <span>Motivo</span>
                    <div className='product-form-input'>
                        <input
                            type='text'
                            disabled={saving}
                            placeholder={reasonPlaceholder}
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
                <Notice onClose={() => setRegistered(null)}>
                    Ajuste registrado: {signedUnitsText(registered.cantidad)}. Quedan {unitsText(registered.existencias)}.
                </Notice>
            )}

            <button type='submit' className='products-button products-button-primary' disabled={saving}>
                <SlidersHorizontal size={18} />{saving ? 'Registrando…' : 'Registrar ajuste'}
            </button>
        </form>
    )
}

export default AdjustmentForm
