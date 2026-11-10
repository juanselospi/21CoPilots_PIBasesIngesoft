import { useState } from 'react'
import { PackagePlus } from 'lucide-react'
import { readPriceInput } from '../../components/product-form/priceFields.js'
import { readStockInput } from '../../components/product-form/stockInput.js'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import Notice from '../../components/notice/Notice.jsx'
import { unitsText } from './merchandiseFormat.js'
import InputUnit from '../../components/input-unit/InputUnit.jsx'

const rules = {
    cantidad: { obligatorio: true, tipo: 'entero', minimo: 1, mensajeMinimo: 'La cantidad tiene que ser mayor que 0.' },
    costoUnitario: { obligatorio: true, tipo: 'numero', minimo: 0 },
}

const asText = (value) => (value === null || value === undefined ? '' : String(value))

// Cantidad entera y positiva, o null mientras no lo sea
const positiveInteger = (text) => (/^\d+$/.test(text) && Number(text) > 0 ? Number(text) : null)

// Ingreso de mercancía (RF-13): cantidad y costo de esa compra, que arranca con el costo actual.
// No llama a la API: usa onRegister(values), que devuelve { movement } o { error, fields }.
// onPreview(existencias) le dice a la página cuántas quedarían, o null si todavía no se sabe.
function RestockForm({ product, onRegister, onPreview }) {
    const {
        valores: values, errores: errors, formularioRef, cambiarCampo, validar,
        erroresServidor, reiniciar, atributosCampo, idError,
    } = useFormulario({ cantidad: '', costoUnitario: asText(product.costoItem) }, rules)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [registered, setRegistered] = useState(null)

    const quantity = positiveInteger(values.cantidad)
    const unitCost = values.costoUnitario === '' ? null : Number(values.costoUnitario)
    const totalCost = quantity !== null && Number.isFinite(unitCost) ? quantity * unitCost : null

    const setField = (key, value) => {
        if (value === null) return
        cambiarCampo(key, value)
        setSaveError(null)
        setRegistered(null)
        if (key === 'cantidad') {
            const next = positiveInteger(value)
            onPreview(next === null ? null : product.stock + next)
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (saving || !validar()) return

        setSaving(true)
        setSaveError(null)
        const result = await onRegister({ cantidad: values.cantidad, costoUnitario: values.costoUnitario })
        setSaving(false)

        if (result.error) {
            setSaveError(result.error)
            erroresServidor(result.fields)
        } else {
            setRegistered(result.movement)
            // La cantidad vacía evita registrar la misma compra dos veces sin querer;
            // el costo se queda para la siguiente compra del mismo producto
            reiniciar({ cantidad: '', costoUnitario: values.costoUnitario })
            onPreview(null)
        }
    }

    const fieldError = (key) => errors[key] && <p id={idError(key)} className='product-form-error'>{errors[key]}</p>

    return (
        <form ref={formularioRef} noValidate className='merchandise-card' aria-label='Ingreso de mercancía' onSubmit={handleSubmit}>
            <p className='merchandise-help'>Mercancía que llegó del proveedor. Suma a las existencias y actualiza el costo del producto.</p>

            <div className='merchandise-fields'>
                <label className='product-form-field'>
                    <span>Cantidad recibida</span>
                    <div className='product-form-input'>
                        <input
                            type='text'
                            inputMode='numeric'
                            disabled={saving}
                            placeholder='Ej. 10'
                            {...atributosCampo('cantidad')}
                            value={values.cantidad}
                            onChange={(event) => setField('cantidad', readStockInput(event.target.value))}
                        />
                        <InputUnit unit='unidades' />
                    </div>
                    {fieldError('cantidad')}
                </label>

                <label className='product-form-field'>
                    <span>Costo unitario de esta compra</span>
                    <div className='product-form-input'>
                        <input
                            type='text'
                            inputMode='decimal'
                            disabled={saving}
                            {...atributosCampo('costoUnitario')}
                            value={values.costoUnitario}
                            onChange={(event) => setField('costoUnitario', readPriceInput(event.target.value, false))}
                        />
                        <InputUnit unit='$' />
                    </div>
                    {fieldError('costoUnitario')}
                </label>

                <div className='merchandise-total'>
                    <span>Costo total de la compra</span>
                    <strong>{totalCost === null ? '—' : priceFormat.format(totalCost)}</strong>
                </div>
            </div>

            {saveError && <p className='product-form-alert' role='alert'>{saveError}</p>}
            {registered && (
                <Notice onClose={() => setRegistered(null)}>
                    Ingreso registrado: {unitsText(registered.cantidad)} a {priceFormat.format(registered.costoUnitario)} cada una.
                    {' '}Quedan {unitsText(registered.existencias)}.
                </Notice>
            )}

            <button type='submit' className='products-button products-button-primary' disabled={saving}>
                <PackagePlus size={18} />{saving ? 'Registrando…' : 'Registrar ingreso'}
            </button>
        </form>
    )
}

export default RestockForm
