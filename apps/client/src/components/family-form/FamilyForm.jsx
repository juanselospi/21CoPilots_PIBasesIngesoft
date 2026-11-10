import { useEffect, useId, useState } from 'react'
import { X } from 'lucide-react'
// Mismo aspecto que los modales de producto
import '../product-form/ProductForm.css'
import { percentHelp, priceRules, readPriceInput } from '../product-form/priceFields.js'
import InfoTip from '../info-tip/InfoTip.jsx'
import InputUnit from '../input-unit/InputUnit.jsx'
import { useFormulario } from '../../hooks/useFormulario.js'
import { productCountText } from '../../pages/families/toAdminFamily.js'

// Porcentajes que usan los productos de la familia que no tienen uno propio
const percentFields = [
    { key: 'importacionPct', label: 'Importación (%)', allowNegative: false },
    { key: 'margenPct', label: 'Margen (%)', allowNegative: true },
]
const percentKeys = percentFields.map(({ key }) => key)

const asText = (value) => (value === null || value === undefined ? '' : String(value))

const valuesOf = (family) => ({
    name: family?.name ?? '',
    description: asText(family?.description),
    importacionPct: asText(family?.importacionPct),
    margenPct: asText(family?.margenPct),
})

// Al crear, importación y margen son opcionales y valen 0; al editar no se pueden dejar vacíos
const rulesFor = (editing) => ({
    name: { obligatorio: true },
    importacionPct: { ...priceRules.importacionPct, obligatorio: editing },
    margenPct: { ...priceRules.margenPct, obligatorio: editing },
})

// Modal para agregar (sin `family`) o editar una familia. No llama a la API:
// usa onSave(values), que devuelve {} si se guardó o { error, fields } si el servidor lo rechazó.
function FamilyForm({ family, onClose, onSave }) {
    const editing = Boolean(family)
    const {
        valores: values, errores: errors, formularioRef, cambiarCampo, validar,
        erroresServidor, atributosCampo, idError,
    } = useFormulario(() => valuesOf(family), rulesFor(editing))
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const formId = useId()

    // Al editar solo se envía lo que cambió
    const initial = valuesOf(family)
    const changedFields = Object.keys(initial).filter((key) => (percentKeys.includes(key)
        ? values[key] === '' || Number(values[key]) !== family?.[key]
        : values[key].trim() !== initial[key]))
    const hasChanges = !editing || changedFields.length > 0

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
        cambiarCampo(key, value)
        setSaveError(null)
    }

    const handlePercentChange = (key, allowNegative, input) => {
        const value = readPriceInput(input, allowNegative)
        if (value !== null) setField(key, value)
    }

    // Si se guardó, quien abrió el modal lo cierra
    const handleSubmit = async (event) => {
        event.preventDefault()
        if (saving || !validar() || !hasChanges) return

        setSaving(true)
        setSaveError(null)
        const fields = editing ? changedFields : Object.keys(initial)
        const result = await onSave(Object.fromEntries(fields.map((key) => [key, values[key].trim()])))

        if (result.error) {
            setSaving(false)
            setSaveError(result.error)
            erroresServidor(result.fields)
        }
    }

    const fieldError = (key) => errors[key] && <p id={idError(key)} className='product-form-error'>{errors[key]}</p>

    return (
        <div className='product-form-overlay' onClick={close}>
            <form
                ref={formularioRef}
                noValidate
                className='product-form-modal'
                role='dialog'
                aria-modal='true'
                aria-labelledby='family-form-title'
                onClick={(event) => event.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <header className='product-form-header'>
                    <div>
                        <h2 id='family-form-title'>{editing ? 'Editar familia' : 'Agregar familia'}</h2>
                        <p>
                            {editing
                                ? `${family.name} · ${productCountText(family.productCount)}`
                                : 'Los productos sin importación o margen propio usan los de su familia.'}
                        </p>
                    </div>
                    <button type='button' className='product-form-close' aria-label='Cerrar' disabled={saving} onClick={close}>
                        <X size={20} />
                    </button>
                </header>

                <label className='product-form-field'>
                    <span>Nombre</span>
                    <div className='product-form-input'>
                        <input
                            type='text'
                            disabled={saving}
                            placeholder='Ej. Funko Pop'
                            {...atributosCampo('name')}
                            value={values.name}
                            onChange={(event) => setField('name', event.target.value)}
                        />
                    </div>
                    {fieldError('name')}
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

                {/* No es un <label> que envuelve: el texto de la ayuda quedaría en el nombre del input */}
                {percentFields.map(({ key, label, allowNegative }) => (
                    <div key={key} className='product-form-field'>
                        <span className='product-form-label-help'>
                            <label htmlFor={`${formId}-${key}`}>
                                {label}{!editing && <small className='product-form-optional'> (opcional)</small>}
                            </label>
                            <InfoTip label={label}>{percentHelp[key]}</InfoTip>
                        </span>
                        <div className='product-form-input'>
                            <input
                                id={`${formId}-${key}`}
                                type='text'
                                inputMode='decimal'
                                disabled={saving}
                                placeholder={editing ? undefined : '0'}
                                {...atributosCampo(key)}
                                value={values[key]}
                                onChange={(event) => handlePercentChange(key, allowNegative, event.target.value)}
                            />
                            <InputUnit unit='%' />
                        </div>
                        {fieldError(key)}
                    </div>
                ))}

                {editing && family.productCount > 0 && (
                    <p className='product-form-hint'>
                        Cambiar la importación o el margen cambia el precio de los productos que los heredan.
                    </p>
                )}

                {saveError && <p className='product-form-alert' role='alert'>{saveError}</p>}

                <footer className='product-form-actions'>
                    <button type='button' className='product-form-button' disabled={saving} onClick={close}>
                        Cancelar
                    </button>
                    <button
                        type='submit'
                        className='product-form-button product-form-button-primary'
                        disabled={saving || !hasChanges}
                    >
                        {saving ? 'Guardando…' : editing ? 'Guardar' : 'Agregar'}
                    </button>
                </footer>
            </form>
        </div>
    )
}

export default FamilyForm
