import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import './ProductForm.css'
import { priceFields, priceRules, readPriceInput } from './priceFields.js'
import StockFields from './StockFields.jsx'
import { useFormulario } from '../../hooks/useFormulario.js'

const fieldRules = {
    ...priceRules,
    stock: { obligatorio: true, tipo: 'entero', minimo: 0 },
}

const derivedFields = [
    { key: 'costoTotal', label: 'Costo total' },
    { key: 'precioSinImpuesto', label: 'Precio sin impuesto' },
    { key: 'precioFinal', label: 'Precio final' },
]

const asText = (value) => (value === null || value === undefined ? '' : String(value))

// Valores iniciales de los inputs: los números como texto
const valuesOf = (product) => ({
    ...Object.fromEntries(priceFields.map(({ key }) => [key, asText(product[key])])),
    stock: asText(product.stock),
    backorder: Boolean(product.backorder),
})

// precio, existencias y contrapedido. No llama a la API:
// usa onSave, que devuelve { product } si se guardó o { error, fields } si el servidor lo rechazó.
function EditProduct({ product, formatPrice, onClose, onSave }) {
    // Producto tal como está guardado ahora
    const [saved, setSaved] = useState(product)
    const {
        valores: values, errores: errors, formularioRef, cambiarCampo, validar,
        erroresServidor, reiniciar, atributosCampo, idError,
    } = useFormulario(() => valuesOf(product), fieldRules)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [justSaved, setJustSaved] = useState(false)

    // Campos que el usuario cambió; solo esos se envían
    const changedPrices = priceFields
        .map(({ key }) => key)
        .filter((key) => values[key] === '' || Number(values[key]) !== saved[key])
    const changedFields = [
        ...changedPrices,
        ...(values.stock === '' || Number(values.stock) !== saved.stock ? ['stock'] : []),
        ...(values.backorder !== Boolean(saved.backorder) ? ['backorder'] : []),
    ]
    const hasChanges = changedFields.length > 0

    // No se cierra mientras guarda
    const close = () => {
        if (!saving) onClose()
    }

    const setField = (key, value) => {
        cambiarCampo(key, value)
        setSaveError(null)
        setJustSaved(false)
    }

    const handlePriceChange = (key, allowNegative, input) => {
        const value = readPriceInput(input, allowNegative)
        if (value !== null) setField(key, value)
    }

    useEffect(() => {
        const closeOnEscape = (event) => event.key === 'Escape' && !saving && onClose()
        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
    }, [saving, onClose])

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (saving || !validar() || !hasChanges) return

        setSaving(true)
        setSaveError(null)
        const result = await onSave(saved.sku, Object.fromEntries(changedFields.map((key) => [key, values[key]])))
        setSaving(false)

        if (result.error) {
            setSaveError(result.error)
            erroresServidor(result.fields)
        } else {
            setSaved(result.product)
            reiniciar(valuesOf(result.product))
            setJustSaved(true)
        }
    }

    return (
        <div className='product-form-overlay' onClick={close}>
            <form
                ref={formularioRef}
                noValidate
                className='product-form-modal'
                role='dialog'
                aria-modal='true'
                aria-labelledby='edit-product-title'
                onClick={(event) => event.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <header className='product-form-header'>
                    <div>
                        <h2 id='edit-product-title'>Editar producto</h2>
                        <p>{saved.sku} · {saved.name}</p>
                    </div>
                    <button type='button' className='product-form-close' aria-label='Cerrar' disabled={saving} onClick={close}>
                        <X size={20} />
                    </button>
                </header>

                {priceFields.map(({ key, label, unit, allowNegative }) => (
                    <label key={key} className='product-form-field'>
                        <span>{label}</span>
                        <div className='product-form-input'>
                            <input
                                type='text'
                                inputMode='decimal'
                                disabled={saving}
                                {...atributosCampo(key)}
                                value={values[key]}
                                onChange={(event) => handlePriceChange(key, allowNegative, event.target.value)}
                            />
                            <span>{unit}</span>
                        </div>
                        {errors[key] && <p id={idError(key)} className='product-form-error'>{errors[key]}</p>}
                    </label>
                ))}

                <div className='product-form-field product-form-locked'>
                    <span>Impuesto de venta</span>
                    <strong>{saved.taxRate} %</strong>
                </div>

                <section className='product-form-derived'>
                    {/* TODO: vista previa con el motor de precios del servidor (SCRUM-28) */}
                    {derivedFields.map(({ key, label }) => {
                        const amount = saved.breakdown?.[key]
                        return (
                            <div key={key}>
                                <span>{label}</span>
                                <span>{changedPrices.length > 0 || amount === null || amount === undefined ? 'Se calcula al guardar' : formatPrice(amount)}</span>
                            </div>
                        )
                    })}
                </section>

                <StockFields
                    stock={values.stock}
                    backorder={values.backorder}
                    error={errors.stock}
                    inputProps={atributosCampo('stock')}
                    errorId={idError('stock')}
                    disabled={saving}
                    onChange={setField}
                />

                {saveError && <p className='product-form-alert' role='alert'>{saveError}</p>}
                {justSaved && <p className='product-form-success' role='status'>Producto actualizado.</p>}

                <footer className='product-form-actions'>
                    <button type='button' className='product-form-button' disabled={saving} onClick={close}>
                        {justSaved ? 'Cerrar' : 'Cancelar'}
                    </button>
                    <button
                        type='submit'
                        className='product-form-button product-form-button-primary'
                        disabled={saving || !hasChanges}
                    >
                        {saving ? 'Guardando…' : 'Guardar'}
                    </button>
                </footer>
            </form>
        </div>
    )
}

export default EditProduct
