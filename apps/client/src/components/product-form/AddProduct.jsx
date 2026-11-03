import { useEffect, useId, useState } from 'react'
import { Plus, X } from 'lucide-react'
import './ProductForm.css'
import { priceFields, priceRules, readPriceInput } from './priceFields.js'
import StockFields from './StockFields.jsx'
import FamilyForm from '../family-form/FamilyForm.jsx'
import { useFormulario } from '../../hooks/useFormulario.js'

// Datos del producto; los marcados como obligatorios también los exige el servidor.
// El selector de familia va entre los dos grupos.
const identityFields = [
    { key: 'sku', label: 'Código', required: true, placeholder: 'Ej. LEG-001' },
    { key: 'name', label: 'Nombre', required: true },
]
const detailFields = [
    { key: 'supplier', label: 'Proveedor' },
    { key: 'imageUrl', label: 'Imagen (dirección web)', type: 'url', placeholder: 'https://…' },
]

// Importación y margen vacíos: el producto usa los de su familia
const inheritableFields = ['importacionPct', 'margenPct']
const inheritedLabel = { importacionPct: 'la importación', margenPct: 'el margen' }

const fieldRules = {
    ...Object.fromEntries([...identityFields, ...detailFields].map(({ key, required, type }) => [key, { obligatorio: required, tipo: type }])),
    category: { obligatorio: true },
    ...priceRules,
    importacionPct: { ...priceRules.importacionPct, obligatorio: false },
    margenPct: { ...priceRules.margenPct, obligatorio: false },
    stock: { tipo: 'entero', minimo: 0 },
}

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
    stock: '',
    backorder: false,
}

const hasValue = (value) => value !== null && value !== undefined

// No llama a la API: usa `onCreate`, que devuelve { product } si se guardó o { error, fields }
// si el servidor lo rechazó, y `onCreateFamily`, que devuelve { family } o { error, fields }.
function AddProduct({ families, formatPrice, onClose, onCreate, onCreateFamily }) {
    const {
        valores: values, errores: errors, formularioRef, cambiarCampo, validar,
        erroresServidor, reiniciar, atributosCampo, idError,
    } = useFormulario(emptyProduct, fieldRules)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [created, setCreated] = useState(null)
    const [creatingFamily, setCreatingFamily] = useState(false)
    // Familias creadas desde aquí; se muestran aunque la lista todavía se esté recargando
    const [newFamilies, setNewFamilies] = useState([])
    const familySelectId = useId()

    const familyOptions = [
        ...families.filter(({ active }) => active),
        ...newFamilies.filter(({ name }) => !families.some((family) => family.name === name)),
    ]
    // Puede no haber ninguna elegida todavía
    const family = familyOptions.find(({ name }) => name === values.category)

    // No se cierra mientras guarda; con el modal de familia abierto, Escape cierra solo ese
    const close = () => {
        if (!saving) onClose()
    }

    useEffect(() => {
        const closeOnEscape = (event) => event.key === 'Escape' && !saving && !creatingFamily && onClose()
        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
    }, [saving, creatingFamily, onClose])

    const setField = (key, value) => {
        cambiarCampo(key, value)
        setSaveError(null)
    }

    const handlePriceChange = (key, allowNegative, input) => {
        const value = readPriceInput(input, allowNegative)
        if (value !== null) setField(key, value)
    }

    // La familia creada queda elegida en el selector
    const handleFamilySave = async (familyValues) => {
        const result = await onCreateFamily(familyValues)
        if (!result.error) {
            setNewFamilies((current) => [...current, result.family])
            setField('category', result.family.name)
            setCreatingFamily(false)
        }
        return result
    }

    // «Hereda 25 % de Coleccionables» debajo de importación y margen cuando quedan vacíos
    const inheritHint = (key) => {
        if (!inheritableFields.includes(key) || values[key] !== '') return null
        if (!hasValue(family?.[key])) return 'Vacío: usa el de la familia.'
        return `Hereda ${family[key]} % de ${family.name}`
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (saving || !validar()) return

        setSaving(true)
        setSaveError(null)
        const result = await onCreate(values)
        setSaving(false)

        if (result.error) {
            setSaveError(result.error)
            erroresServidor(result.fields)
        } else {
            setCreated(result.product)
        }
    }

    // Deja el formulario en blanco para agregar otro
    const addAnother = () => {
        reiniciar()
        setCreated(null)
    }

    const fieldError = (key) => errors[key] && <p id={idError(key)} className='product-form-error'>{errors[key]}</p>

    const renderTextField = ({ key, label, required, placeholder, type = 'text' }) => (
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
    )

    if (created) {
        // Lo que el producto tomó de su familia, con el valor de la familia si se conoce
        const createdFamily = familyOptions.find(({ name }) => name === created.category)
        const inherited = inheritableFields
            .filter((key) => created[key] === null)
            .map((key) => (hasValue(createdFamily?.[key])
                ? `${inheritedLabel[key]} (${createdFamily[key]} %)`
                : inheritedLabel[key]))

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
                        Se guardó con precio final de {formatPrice(created.price)} y{' '}
                        {created.stock} {created.stock === 1 ? 'unidad' : 'unidades'} en existencia.
                        {inherited.length > 0 && ` Usa ${inherited.join(' y ')} de la familia ${created.category}.`}
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
        <>
            <div className='product-form-overlay' onClick={close}>
                <form
                    ref={formularioRef}
                    noValidate
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

                    {identityFields.map(renderTextField)}

                    {/* No es un <label> que envuelve: el botón «Crear familia» quedaría asociado a la etiqueta */}
                    <div className='product-form-field'>
                        <div className='product-form-label-row'>
                            <label htmlFor={familySelectId}>Familia</label>
                            <button
                                type='button'
                                className='product-form-link'
                                disabled={saving}
                                onClick={() => setCreatingFamily(true)}
                            >
                                <Plus size={14} />Crear familia
                            </button>
                        </div>
                        <div className='product-form-input'>
                            <select
                                id={familySelectId}
                                disabled={saving}
                                {...atributosCampo('category')}
                                value={values.category}
                                onChange={(event) => setField('category', event.target.value)}
                            >
                                <option value=''>Seleccione una familia</option>
                                {familyOptions.map(({ name }) => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </div>
                        {fieldError('category')}
                    </div>

                    {detailFields.map(renderTextField)}

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

                    <section className='product-form-prices'>
                        {priceFields.map(({ key, label, unit, allowNegative }) => {
                            const hint = inheritHint(key)
                            return (
                                <label key={key} className='product-form-field'>
                                    <span>{label}</span>
                                    <div className='product-form-input'>
                                        <input
                                            type='text'
                                            inputMode='decimal'
                                            disabled={saving}
                                            placeholder={inheritableFields.includes(key) && hasValue(family?.[key]) ? String(family[key]) : undefined}
                                            {...atributosCampo(key)}
                                            value={values[key]}
                                            onChange={(event) => handlePriceChange(key, allowNegative, event.target.value)}
                                        />
                                        <span>{unit}</span>
                                    </div>
                                    {fieldError(key) || (hint && <p className='product-form-hint'>{hint}</p>)}
                                </label>
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
                        optional
                        onChange={setField}
                    />

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

            {/* Fuera del <form> del producto: un formulario no puede ir dentro de otro */}
            {creatingFamily && (
                <FamilyForm family={null} onClose={() => setCreatingFamily(false)} onSave={handleFamilySave} />
            )}
        </>
    )
}

export default AddProduct
