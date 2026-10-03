import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import './ProductForm.css'
import { priceFields, readPriceInput, validatePrices } from './priceFields.js'

const CATEGORY_LIST_ID = 'add-product-categories'

// Datos del producto; los marcados como obligatorios también los exige el servidor
const textFields = [
    { key: 'sku', label: 'Código', required: true, placeholder: 'Ej. LEG-001' },
    { key: 'name', label: 'Nombre', required: true },
    { key: 'category', label: 'Categoría', required: true, list: CATEGORY_LIST_ID },
    { key: 'supplier', label: 'Proveedor' },
    { key: 'imageUrl', label: 'Imagen (dirección web)', type: 'url', placeholder: 'https://…' },
]

// Al crear, importación y margen son opcionales: si quedan vacíos valen 0
const optionalPrices = ['importacionPct', 'margenPct']

const emptyProduct = {
    sku: '',
    name: '',
    category: '',
    supplier: '',
    imageUrl: '',
    description: '',
    costoItem: '',
    importacionPct: '',
    margenPct: '',
    backorder: false,
}

// Modal "Agregar producto". No llama a la API: usa `onCreate`, que devuelve
// { product } si se guardó o { error, fields } si el servidor lo rechazó.
function AddProduct({ categories, formatPrice, onClose, onCreate }) {
    const [values, setValues] = useState(emptyProduct)
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [created, setCreated] = useState(null)

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
        setValues({ ...values, [key]: value })
        setErrors({ ...errors, [key]: undefined })
        setSaveError(null)
    }

    const handlePriceChange = (key, allowNegative, input) => {
        const value = readPriceInput(input, allowNegative)
        if (value !== null) setField(key, value)
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        const foundErrors = validatePrices(values, optionalPrices)
        setErrors(foundErrors)
        if (Object.keys(foundErrors).length > 0) return

        setSaving(true)
        setSaveError(null)
        const result = await onCreate(values)
        setSaving(false)

        if (result.error) {
            setSaveError(result.error)
            setErrors(Object.fromEntries(result.fields.map((key) => [key, 'Revise este valor.'])))
        } else {
            setCreated(result.product)
        }
    }

    // Deja el formulario en blanco para agregar otro
    const addAnother = () => {
        setValues(emptyProduct)
        setErrors({})
        setCreated(null)
    }

    if (created) {
        return (
            <div className='product-form-overlay' onClick={close}>
                <div
                    className='product-form-modal'
                    role='dialog'
                    aria-modal='true'
                    aria-labelledby='add-product-title'
                    onClick={(event) => event.stopPropagation()}
                >
                    <header className='product-form-header'>
                        <div>
                            <h2 id='add-product-title'>Producto agregado</h2>
                            <p>{created.sku} · {created.name}</p>
                        </div>
                        <button type='button' className='product-form-close' aria-label='Cerrar' onClick={close}>
                            <X size={20} />
                        </button>
                    </header>

                    <p className='product-form-success' role='status'>
                        Se guardó con precio final de {formatPrice(created.price)} y 0 existencias.
                    </p>

                    <footer className='product-form-actions'>
                        <button type='button' className='product-form-button' onClick={addAnother}>Agregar otro</button>
                        <button type='button' className='product-form-button product-form-button-primary' onClick={close}>
                            Cerrar
                        </button>
                    </footer>
                </div>
            </div>
        )
    }

    return (
        <div className='product-form-overlay' onClick={close}>
            <form
                className='product-form-modal product-form-wide'
                role='dialog'
                aria-modal='true'
                aria-labelledby='add-product-title'
                onClick={(event) => event.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <header className='product-form-header'>
                    <div>
                        <h2 id='add-product-title'>Agregar producto</h2>
                        <p>El precio final lo calcula el sistema al guardar.</p>
                    </div>
                    <button type='button' className='product-form-close' aria-label='Cerrar' disabled={saving} onClick={close}>
                        <X size={20} />
                    </button>
                </header>

                {textFields.map(({ key, label, required, placeholder, list, type = 'text' }) => (
                    <label key={key} className='product-form-field'>
                        <span>{label}{!required && <small className='product-form-optional'> (opcional)</small>}</span>
                        <div className='product-form-input'>
                            <input
                                type={type}
                                required={required}
                                disabled={saving}
                                placeholder={placeholder}
                                list={list}
                                aria-invalid={Boolean(errors[key])}
                                value={values[key]}
                                onChange={(event) => setField(key, event.target.value)}
                            />
                        </div>
                        {errors[key] && <p className='product-form-error'>{errors[key]}</p>}
                    </label>
                ))}

                {/* Sugerencias con las categorías que ya existen; se puede escribir otra */}
                <datalist id={CATEGORY_LIST_ID}>
                    {categories.map((name) => <option key={name} value={name} />)}
                </datalist>

                <label className='product-form-field'>
                    <span>Descripción<small className='product-form-optional'> (opcional)</small></span>
                    <div className='product-form-input'>
                        <textarea
                            rows={3}
                            disabled={saving}
                            aria-invalid={Boolean(errors.description)}
                            value={values.description}
                            onChange={(event) => setField('description', event.target.value)}
                        />
                    </div>
                    {errors.description && <p className='product-form-error'>{errors.description}</p>}
                </label>

                <section className='product-form-prices'>
                    {priceFields.map(({ key, label, unit, allowNegative }) => (
                        <label key={key} className='product-form-field'>
                            <span>{label}</span>
                            <div className='product-form-input'>
                                <input
                                    type='text'
                                    inputMode='decimal'
                                    required={!optionalPrices.includes(key)}
                                    disabled={saving}
                                    placeholder={optionalPrices.includes(key) ? '0' : undefined}
                                    aria-invalid={Boolean(errors[key])}
                                    value={values[key]}
                                    onChange={(event) => handlePriceChange(key, allowNegative, event.target.value)}
                                />
                                <span>{unit}</span>
                            </div>
                            {errors[key] && <p className='product-form-error'>{errors[key]}</p>}
                        </label>
                    ))}
                </section>

                {/* RN-03: sin existencias, solo se muestra en la tienda si admite contrapedido */}
                <label className='product-form-check'>
                    <input
                        type='checkbox'
                        disabled={saving}
                        checked={values.backorder}
                        onChange={(event) => setField('backorder', event.target.checked)}
                    />
                    <span>Admite contrapedido (se puede vender sin existencias)</span>
                </label>

                {saveError && <p className='product-form-alert' role='alert'>{saveError}</p>}

                <footer className='product-form-actions'>
                    <button type='button' className='product-form-button' disabled={saving} onClick={close}>
                        Cancelar
                    </button>
                    <button type='submit' className='product-form-button product-form-button-primary' disabled={saving}>
                        {saving ? 'Guardando…' : 'Agregar'}
                    </button>
                </footer>
            </form>
        </div>
    )
}

export default AddProduct
