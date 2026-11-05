import { useState } from 'react'
import './ProductFilters.css'
import { availabilityOptions, emptyFilters } from './productFilters.js'

// Panel de filtros del listado; los cambios quedan en un borrador hasta "Aplicar".
// Siempre está montado para poder animar la apertura y el cierre: `open` lo despliega
// y, cerrado, queda inerte (sus controles no reciben foco ni los lee el lector de pantalla).
function ProductFilters({ id, open, filters, categories, onApply, onClose }) {
    const [draft, setDraft] = useState(filters)
    const [error, setError] = useState(null)

    // Al abrir el panel o cambiar los filtros aplicados, el borrador arranca de nuevo con ellos
    const [previous, setPrevious] = useState({ open, filters })
    if (previous.open !== open || previous.filters !== filters) {
        setPrevious({ open, filters })
        if (open || previous.filters !== filters) {
            setDraft(filters)
            setError(null)
        }
    }

    const setField = (key, value) => {
        setDraft({ ...draft, [key]: value })
        setError(null)
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        if (draft.precioMin !== '' && draft.precioMax !== '' && Number(draft.precioMin) > Number(draft.precioMax)) {
            setError('El precio mínimo no puede ser mayor que el máximo.')
            return
        }
        onApply(draft)
    }

    // Si la categoría filtrada ya no está en la lista, igual se muestra como opción
    const categoryOptions = draft.categoria && !categories.includes(draft.categoria)
        ? [draft.categoria, ...categories]
        : categories

    return (
        <div id={id} className='product-filters-collapse' data-open={open} inert={!open}>
            <div className='product-filters-collapse-inner'>
                <form className='product-filters' aria-label='Filtros' onSubmit={handleSubmit}>
                    <div className='product-filters-grid'>
                        <label className='product-filters-field'>
                            <span>Categoría</span>
                            <select value={draft.categoria} onChange={(event) => setField('categoria', event.target.value)}>
                                <option value=''>Todas</option>
                                {categoryOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </label>

                        <label className='product-filters-field'>
                            <span>Disponibilidad</span>
                            <select value={draft.disponibilidad} onChange={(event) => setField('disponibilidad', event.target.value)}>
                                <option value=''>Todas</option>
                                {availabilityOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                            </select>
                        </label>

                        <label className='product-filters-field'>
                            <span>Precio final mínimo</span>
                            <input
                                type='number'
                                min='0'
                                step='0.01'
                                inputMode='decimal'
                                aria-invalid={Boolean(error)}
                                value={draft.precioMin}
                                onChange={(event) => setField('precioMin', event.target.value)}
                            />
                        </label>

                        <label className='product-filters-field'>
                            <span>Precio final máximo</span>
                            <input
                                type='number'
                                min='0'
                                step='0.01'
                                inputMode='decimal'
                                aria-invalid={Boolean(error)}
                                value={draft.precioMax}
                                onChange={(event) => setField('precioMax', event.target.value)}
                            />
                        </label>
                    </div>

                    <div className='product-filters-checks'>
                        <label>
                            <input
                                type='checkbox'
                                checked={draft.existenciasBajas}
                                onChange={(event) => setField('existenciasBajas', event.target.checked)}
                            />
                            Existencias bajas
                        </label>
                        <label>
                            <input
                                type='checkbox'
                                checked={draft.margenNegativo}
                                onChange={(event) => setField('margenNegativo', event.target.checked)}
                            />
                            Margen negativo
                        </label>
                    </div>

                    {error && <p className='product-filters-error' role='alert'>{error}</p>}

                    <footer className='product-filters-actions'>
                        <button type='button' className='product-filters-button product-filters-link' onClick={() => setDraft(emptyFilters)}>
                            Quitar todos
                        </button>
                        <button type='button' className='product-filters-button' onClick={onClose}>Cancelar</button>
                        <button type='submit' className='product-filters-button product-filters-button-primary'>Aplicar</button>
                    </footer>
                </form>
            </div>
        </div>
    )
}

export default ProductFilters
