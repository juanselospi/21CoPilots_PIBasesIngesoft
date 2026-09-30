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
        if (Number.isNaN(Number(values[key])) || values[key] === '-' || values[key] === '.') {
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

function ProductEditModal({ product, taxRate, onClose, onSave }) {
    const [values, setValues] = useState({
        costoItem: product.costoItem ?? '',
        importacionPct: product.importacionPct ?? '',
        margenPct: product.margenPct ?? '',
    })
    const [errors, setErrors] = useState({})

    const handleChange = (key, allowNegative, input) => {
        const value = input.replace(',', '.')
        const pattern = allowNegative ? signedNumber : positiveNumber
        if (pattern.test(value)) {
            setValues({ ...values, [key]: value })
            setErrors({ ...errors, [key]: undefined })
        }
    }

    useEffect(() => {
        const closeOnEscape = (event) => event.key === 'Escape' && onClose()
        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
    }, [onClose])

    const handleSubmit = (event) => {
        event.preventDefault()
        const foundErrors = validate(values)
        setErrors(foundErrors)
        if (Object.keys(foundErrors).length === 0) {
            onSave(product.sku, values)
        }
    }

    return (
        <div className='product-edit-overlay' onClick={onClose}>
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
                        <p>{product.sku} · {product.name}</p>
                    </div>
                    <button type='button' className='product-edit-close' aria-label='Cerrar' onClick={onClose}>
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
                    <strong>{taxRate} %</strong>
                </div>

                <section className='product-edit-derived'>
                    {/* TODO: vista previa con el motor de precios del servidor (SCRUM-28) */}
                    {derivedFields.map(({ key, label }) => (
                        <div key={key}>
                            <span>{label}</span>
                            <span>Se calcula al guardar</span>
                        </div>
                    ))}
                </section>

                <footer className='product-edit-actions'>
                    <button type='button' className='product-edit-button' onClick={onClose}>Cancelar</button>
                    <button type='submit' className='product-edit-button product-edit-button-primary'>Guardar</button>
                </footer>
            </form>
        </div>
    )
}

export default ProductEditModal
