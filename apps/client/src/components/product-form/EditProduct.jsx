import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import './ProductForm.css'
import { priceFields, priceRules, readPriceInput } from './priceFields.js'
import StockFields from './StockFields.jsx'
import { useFormulario } from '../../hooks/useFormulario.js'

// Datos generales; el código no se puede cambiar
const textFields = [
    { key: 'name', label: 'Nombre', required: true },
    { key: 'supplier', label: 'Proveedor' },
    { key: 'imageUrl', label: 'Imagen (dirección web)', type: 'url', placeholder: 'https://…' },
]
const generalFields = [...textFields.map(({ key }) => key), 'category', 'description']

// Importación y margen pueden ser los de la familia (se envía null) o propios del producto
const inheritableFields = ['importacionPct', 'margenPct']

const derivedFields = [
    { key: 'costoTotal', label: 'Costo total' },
    { key: 'precioSinImpuesto', label: 'Precio sin impuesto' },
    { key: 'precioFinal', label: 'Precio final' },
]

const asText = (value) => (value === null || value === undefined ? '' : String(value))

// Valores iniciales de los inputs: los números como texto
const valuesOf = (product) => ({
    ...Object.fromEntries(generalFields.map((key) => [key, asText(product[key])])),
    ...Object.fromEntries(priceFields.map(({ key }) => [key, asText(product[key])])),
    stock: asText(product.stock),
    backorder: Boolean(product.backorder),
})

// true en los campos que el producto toma de su familia
const inheritedOf = (product) => Object.fromEntries(inheritableFields.map((key) => [key, product[key] === null]))

// Los precios que se heredan no se validan: no se escriben
const rulesFor = (inherited) => ({
    ...Object.fromEntries(textFields.map(({ key, required, type }) => [key, { obligatorio: required, tipo: type }])),
    category: { obligatorio: true },
    ...Object.fromEntries(Object.entries(priceRules).filter(([key]) => !inherited[key])),
    stock: { obligatorio: true, tipo: 'entero', minimo: 0 },
})

// Datos generales, familia, precio, existencias y contrapedido. No llama a la API:
// usa onSave, que devuelve { product } si se guardó o { error, fields } si el servidor lo rechazó.
function EditProduct({ product, families, formatPrice, onClose, onSave }) {
    // Producto tal como está guardado ahora
    const [saved, setSaved] = useState(product)
    const [inherited, setInherited] = useState(() => inheritedOf(product))
    const {
        valores: values, errores: errors, formularioRef, cambiarCampo, validar,
        erroresServidor, reiniciar, atributosCampo, idError,
    } = useFormulario(() => valuesOf(product), rulesFor(inherited))
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [justSaved, setJustSaved] = useState(false)

    // Familias activas; la actual se muestra aunque esté desactivada o la lista no haya cargado
    const familyOptions = families.some(({ name }) => name === saved.category)
        ? families.filter(({ name, active }) => active || name === saved.category)
        : [{ name: saved.category }, ...families.filter(({ active }) => active)]
    const family = familyOptions.find(({ name }) => name === values.category)

    // Campos que el usuario cambió; solo esos se envían
    const wasInherited = inheritedOf(saved)
    const changedGeneral = generalFields.filter((key) => values[key].trim() !== asText(saved[key]))
    const changedPrices = priceFields
        .map(({ key }) => key)
        .filter((key) => (inherited[key]
            ? !wasInherited[key]
            : wasInherited[key] || values[key] === '' || Number(values[key]) !== saved[key]))
    const changedFields = [
        ...changedGeneral,
        ...changedPrices,
        ...(values.stock === '' || Number(values.stock) !== saved.stock ? ['stock'] : []),
        ...(values.backorder !== Boolean(saved.backorder) ? ['backorder'] : []),
    ]
    const hasChanges = changedFields.length > 0
    // Cambiar de familia también cambia el precio si hereda algo de ella
    const priceWillChange = changedPrices.length > 0
        || (changedGeneral.includes('category') && inheritableFields.some((key) => inherited[key]))

    // Heredado → null; texto vacío → null para borrar el dato opcional
    const valueToSend = (key) => {
        if (inherited[key]) return null
        return generalFields.includes(key) ? values[key].trim() || null : values[key]
    }

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

    // Al pasar a «Propio» con el campo vacío, parte del valor de la familia
    const changeMode = (key, inherit) => {
        setInherited((current) => ({ ...current, [key]: inherit }))
        setField(key, inherit || values[key] !== '' ? values[key] : asText(family?.[key]))
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
        const result = await onSave(saved.sku, Object.fromEntries(changedFields.map((key) => [key, valueToSend(key)])))
        setSaving(false)

        if (result.error) {
            setSaveError(result.error)
            erroresServidor(result.fields)
        } else {
            setSaved(result.product)
            setInherited(inheritedOf(result.product))
            reiniciar(valuesOf(result.product))
            setJustSaved(true)
        }
    }

    const fieldError = (key) => errors[key] && <p id={idError(key)} className='product-form-error'>{errors[key]}</p>

    return (
        <div className='product-form-overlay' onClick={close}>
            <form
                ref={formularioRef}
                noValidate
                className='product-form-modal product-form-wide'
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

                {textFields.map(({ key, label, required, placeholder, type = 'text' }) => (
                    <label key={key} className='product-form-field'>
                        <span>{label}{!required && <small className='product-form-optional'> (opcional)</small>}</span>
                        <div className='product-form-input'>
                            <input
                                type={type}
                                disabled={saving}
                                placeholder={placeholder}
                                {...atributosCampo(key)}
                                value={values[key]}
                                onChange={(event) => setField(key, event.target.value)}
                            />
                        </div>
                        {fieldError(key)}
                    </label>
                ))}

                <label className='product-form-field'>
                    <span>Familia</span>
                    <div className='product-form-input'>
                        <select
                            disabled={saving}
                            {...atributosCampo('category')}
                            value={values.category}
                            onChange={(event) => setField('category', event.target.value)}
                        >
                            {familyOptions.map(({ name, active }) => (
                                <option key={name} value={name}>{name}{active === false ? ' (desactivada)' : ''}</option>
                            ))}
                        </select>
                    </div>
                    {fieldError('category')}
                </label>

                <label className='product-form-field'>
                    <span>Descripción<small className='product-form-optional'> (opcional)</small></span>
                    <div className='product-form-input'>
                        <textarea
                            rows={3}
                            disabled={saving}
                            {...atributosCampo('description')}
                            value={values.description}
                            onChange={(event) => setField('description', event.target.value)}
                        />
                    </div>
                    {fieldError('description')}
                </label>

                {priceFields.map(({ key, label, unit, allowNegative }) => {
                    const input = (
                        <div className='product-form-input'>
                            <input
                                type='text'
                                inputMode='decimal'
                                aria-label={label}
                                disabled={saving || inherited[key]}
                                {...atributosCampo(key)}
                                value={inherited[key] ? asText(family?.[key]) : values[key]}
                                onChange={(event) => handlePriceChange(key, allowNegative, event.target.value)}
                            />
                            <span>{unit}</span>
                        </div>
                    )

                    if (!inheritableFields.includes(key)) {
                        return (
                            <label key={key} className='product-form-field'>
                                <span>{label}</span>
                                {input}
                                {fieldError(key)}
                            </label>
                        )
                    }

                    const familyValue = family?.[key]
                    return (
                        <fieldset key={key} className='product-form-field product-form-inherit'>
                            <legend>{label}</legend>
                            <div className='product-form-modes'>
                                <label className='product-form-check'>
                                    <input
                                        type='radio'
                                        name={`${key}-modo`}
                                        disabled={saving}
                                        checked={inherited[key]}
                                        onChange={() => changeMode(key, true)}
                                    />
                                    <span>
                                        Usar el de la familia
                                        {familyValue !== null && familyValue !== undefined && ` (${familyValue} ${unit})`}
                                    </span>
                                </label>
                                <label className='product-form-check'>
                                    <input
                                        type='radio'
                                        name={`${key}-modo`}
                                        disabled={saving}
                                        checked={!inherited[key]}
                                        onChange={() => changeMode(key, false)}
                                    />
                                    <span>Propio</span>
                                </label>
                            </div>
                            {input}
                            {fieldError(key)}
                        </fieldset>
                    )
                })}

                <div className='product-form-field product-form-locked'>
                    <span>Impuesto de venta</span>
                    <strong>{saved.taxRate} %</strong>
                </div>

                {/* Los recalcula el servidor al guardar */}
                <section className='product-form-derived'>
                    {derivedFields.map(({ key, label }) => {
                        const amount = saved.breakdown?.[key]
                        return (
                            <div key={key}>
                                <span>{label}</span>
                                <span>{priceWillChange || amount === null || amount === undefined ? 'Se calcula al guardar' : formatPrice(amount)}</span>
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
