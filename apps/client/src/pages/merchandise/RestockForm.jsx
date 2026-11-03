import { useState } from 'react'
import { PackagePlus } from 'lucide-react'
import { readPriceInput } from '../../components/product-form/priceFields.js'
import { readStockInput } from '../../components/product-form/stockInput.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import { unitsText } from './merchandiseFormat.js'

const rules = {
    cantidad: { obligatorio: true, tipo: 'entero', minimo: 1, mensajeMinimo: 'La cantidad tiene que ser mayor que 0.' },
    costoUnitario: { obligatorio: true, tipo: 'numero', minimo: 0 },
}

const asText = (value) => (value === null || value === undefined ? '' : String(value))

// Ingreso de mercancía (RF-13): cantidad y costo de esa compra, que arranca con el costo actual.
// No llama a la API: usa onRegister(values), que devuelve { movement } o { error, fields }.
function RestockForm({ product, onRegister }) {
    const {
        valores: values, errores: errors, formularioRef, cambiarCampo, validar,
        erroresServidor, reiniciar, atributosCampo, idError,
    } = useFormulario({ cantidad: '', costoUnitario: asText(product.costoItem) }, rules)
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
        const result = await onRegister({ cantidad: values.cantidad, costoUnitario: values.costoUnitario })
        setSaving(false)

        if (result.error) {
            setSaveError(result.error)
            erroresServidor(result.fields)
        } else {
            setRegistered(result.movement)
            // El costo se queda para la siguiente compra del mismo producto
            reiniciar({ cantidad: '', costoUnitario: values.costoUnitario })
        }
    }

    const fieldError = (key) => errors[key] && <p id={idError(key)} className='product-form-error'>{errors[key]}</p>

    return (
        <form ref={formularioRef} noValidate className='merchandise-card' aria-label='Ingreso de mercancía' onSubmit={handleSubmit}>
            <p className='merchandise-help'>Mercancía que llegó. Suma a las existencias y actualiza el costo del producto.</p>

            <div className='merchandise-fields'>
                <label className='product-form-field'>
                    <span>Cantidad</span>
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
                        <span>unidades</span>
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
                        <span>$</span>
                    </div>
                    {fieldError('costoUnitario')}
                </label>
            </div>

            {saveError && <p className='product-form-alert' role='alert'>{saveError}</p>}
            {registered && (
                <p className='product-form-success' role='status'>
                    Se registraron {unitsText(registered.cantidad)}. Quedan {unitsText(registered.existencias)}.
                </p>
            )}

            <button type='submit' className='products-button products-button-primary' disabled={saving}>
                <PackagePlus size={18} />{saving ? 'Registrando…' : 'Registrar'}
            </button>
        </form>
    )
}

export default RestockForm
