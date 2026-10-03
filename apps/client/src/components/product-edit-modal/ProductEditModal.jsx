import { useEffect, useState } from 'react'
import './ProductEditModal.css'

// Campos de precio de SCRUM-23. Los derivados los calcula el motor de precios del
// servidor (RF-03, RF-04, RF-05); el cliente no replica la fórmula.
const editableFields = [
    { key: 'costoItem', label: 'Costo del ítem', unit: '₡', allowNegative: false },
    { key: 'importacionPct', label: 'Importación', unit: '%', allowNegative: false },
    // RN-02, RF-43: admite margen negativo, pero mayor que -100 %
    { key: 'margenPct', label: 'Margen', unit: '%', allowNegative: true },
]

// Solo dígitos y hasta 2 decimales; el signo negativo únicamente donde se permite
const positiveNumber = /^\d*(\.\d{0,2})?$/
const signedNumber = /^-?\d*(\.\d{0,2})?$/

const validate = (values) => {
    const errors = {}
    for (const { key } of editableFields) {
        if (values[key] === '' || Number.isNaN(Number(values[key])) || values[key] === '-' || values[key] === '.') {
            errors[key] = 'Ingrese un número válido.'
        }
    }
    if (!errors.margenPct && Number(values.margenPct) <= -100) {
        errors.margenPct = 'El margen debe ser mayor que -100 %.'
    }
    return errors
}

const derivedFields = [
    { key: 'costoTotal', label: 'Costo total' },
    { key: 'precioSinImpuesto', label: 'Precio sin impuesto' },
    { key: 'precioFinal', label: 'Precio final' },
]

// Valores iniciales de los inputs (como texto)
const valuesOf = (product) => Object.fromEntries(
    editableFields.map(({ key }) => [key, product[key] === null || product[key] === undefined ? '' : String(product[key])])
)

// Modal "Editar precio" (RF-01). No llama a la API: usa `onSave`, que devuelve
// { product } si se guardó o { error, fields } si el servidor lo rechazó.
function ProductEditModal({ product, formatPrice, onClose, onSave }) {
    // Producto tal como está guardado ahora
    const [saved, setSaved] = useState(product)
    const [values, setValues] = useState(() => valuesOf(product))
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [justSaved, setJustSaved] = useState(false)

    // Campos que el usuario cambió; solo esos se envían
    const changedFields = editableFields
        .map(({ key }) => key)
        .filter((key) => values[key] === '' || Number(values[key]) !== saved[key])
    const hasChanges = changedFields.length > 0

    // No se cierra mientras guarda
    const close = () => {
        if (!saving) onClose()
    }

    const handleChange = (key, allowNegative, input) => {
        const value = input.replace(',', '.')
        const pattern = allowNegative ? signedNumber : positiveNumber
        if (pattern.test(value)) {
            setValues({ ...values, [key]: value })
            setErrors({ ...errors, [key]: undefined })
            setSaveError(null)
            setJustSaved(false)
        }
    }

    useEffect(() => {
        const closeOnEscape = (event) => event.key === 'Escape' && !saving && onClose()
        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
    }, [saving, onClose])

    const handleSubmit = async (event) => {
        event.preventDefault()
        const foundErrors = validate(values)
        setErrors(foundErrors)
        if (Object.keys(foundErrors).length > 0 || !hasChanges) return

        setSaving(true)
        setSaveError(null)
        const result = await onSave(saved.sku, Object.fromEntries(changedFields.map((key) => [key, values[key]])))
        setSaving(false)

        if (result.error) {
            setSaveError(result.error)
            setErrors(Object.fromEntries(result.fields.map((key) => [key, 'Revise este valor.'])))
        } else {
            setSaved(result.product)
            setValues(valuesOf(result.product))
            setJustSaved(true)
        }
    }

    return (
        <div className='product-edit-overlay' onClick={close}>
            <form
                className='product-edit-modal'
                role='dialog'
                aria-modal='true'
                aria-labelledby='product-edit-title'
                onClick={(event) => event.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <header className='product-edit-header'>
                    <div>
                        <h2 id='product-edit-title'>Editar precio</h2>
                        <p>{saved.sku} · {saved.name}</p>
                    </div>
                    <button type='button' className='product-edit-close' aria-label='Cerrar' disabled={saving} onClick={close}>
                        ✕
                    </button>
                </header>

                {editableFields.map(({ key, label, unit, allowNegative }) => (
                    <label key={key} className='product-edit-field'>
                        <span>{label}</span>
                        <div className='product-edit-input'>
                            <input
                                type='text'
                                inputMode='decimal'
                                required
                                disabled={saving}
                                aria-invalid={Boolean(errors[key])}
                                value={values[key]}
                                onChange={(event) => handleChange(key, allowNegative, event.target.value)}
                            />
                            <span>{unit}</span>
                        </div>
                        {errors[key] && <p className='product-edit-error'>{errors[key]}</p>}
                    </label>
                ))}

                <div className='product-edit-field product-edit-locked'>
                    <span>Impuesto de venta</span>
                    <strong>{saved.taxRate} %</strong>
                </div>

                <section className='product-edit-derived'>
                    {/* TODO: vista previa con el motor de precios del servidor (SCRUM-28) */}
                    {derivedFields.map(({ key, label }) => {
                        const amount = saved.breakdown?.[key]
                        return (
                            <div key={key}>
                                <span>{label}</span>
                                <span>{hasChanges || amount === null || amount === undefined ? 'Se calcula al guardar' : formatPrice(amount)}</span>
                            </div>
                        )
                    })}
                </section>

                {saveError && <p className='product-edit-alert' role='alert'>{saveError}</p>}
                {justSaved && <p className='product-edit-success' role='status'>Precio actualizado.</p>}

                <footer className='product-edit-actions'>
                    <button type='button' className='product-edit-button' disabled={saving} onClick={close}>
                        {justSaved ? 'Cerrar' : 'Cancelar'}
                    </button>
                    <button
                        type='submit'
                        className='product-edit-button product-edit-button-primary'
                        disabled={saving || !hasChanges}
                    >
                        {saving ? 'Guardando…' : 'Guardar'}
                    </button>
                </footer>
            </form>
        </div>
    )
}

export default ProductEditModal
