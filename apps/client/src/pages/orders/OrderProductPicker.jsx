import { useEffect, useId, useState } from 'react'
import '../../components/confirm-dialog/ConfirmDialog.css'
import QuantityStepper from '../../components/quantity-stepper/QuantityStepper.jsx'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { useListadoAdministrativo } from '../../hooks/useListadoAdministrativo.js'
import { aCantidad } from '../../utils/carrito.js'
import { precioParaComparar, productosElegibles, topeDeBusqueda } from '../../utils/pedidosAdmin.js'

// Espera para buscar hasta que el usuario deje de escribir
const SEARCH_DELAY_MS = 300
const PAGE_SIZE = 24

const stockText = ({ existencias }) => (existencias > 0 ? `${existencias} en existencia` : 'Por contrapedido')

// Diálogo para elegir un producto y agregarlo o reemplazar otro; busca por código o nombre.
// `maxPrice` limita los resultados al precio pagado y `askQuantity` pide cuántas unidades.
// `onConfirm` recibe { sku, nombre, cantidad }; si el servidor lo rechaza, su mensaje se queda aquí.
function OrderProductPicker({ title, description, lines, maxPrice = null, askQuantity = false, confirmLabel, busyLabel, onConfirm, onCancel }) {
    const [search, setSearch] = useState('')
    const [q, setQ] = useState('')
    const [selected, setSelected] = useState(null)
    const [quantity, setQuantity] = useState('1')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)
    const titleId = useId()
    const quantityId = useId()

    useEffect(() => {
        const timer = setTimeout(() => setQ(search.trim()), SEARCH_DELAY_MS)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        const cancelOnEscape = (event) => {
            if (event.key === 'Escape' && !busy) onCancel()
        }
        document.addEventListener('keydown', cancelOnEscape)
        return () => document.removeEventListener('keydown', cancelOnEscape)
    }, [busy, onCancel])

    const listado = useListadoAdministrativo({
        q,
        precioMax: maxPrice === null ? undefined : topeDeBusqueda(maxPrice),
        limite: PAGE_SIZE,
    })
    const products = productosElegibles(listado.datos?.datos ?? [], lines, maxPrice)
    const total = listado.datos?.meta.total ?? 0

    const confirm = async () => {
        setBusy(true)
        setError(null)
        try {
            await onConfirm({ sku: selected.sku, nombre: selected.nombre, cantidad: aCantidad(quantity) })
        } catch (confirmError) {
            setError(confirmError.message)
            setBusy(false)
        }
    }

    return (
        <div className='confirm-dialog-overlay' onClick={busy ? undefined : onCancel}>
            <div
                className='confirm-dialog order-picker'
                role='dialog'
                aria-modal='true'
                aria-labelledby={titleId}
                onClick={(event) => event.stopPropagation()}
            >
                <h2 id={titleId}>{title}</h2>
                <p>{description}</p>

                <input
                    type='search'
                    className='products-search'
                    placeholder='Buscar por código o nombre...'
                    aria-label='Buscar por código o nombre'
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    autoFocus
                />

                <div className='order-picker-results'>
                    {listado.cargando ? (
                        <p className='orders-secondary' role='status'>Buscando productos…</p>
                    ) : listado.error ? (
                        <p className='confirm-dialog-error' role='alert'>{listado.error}</p>
                    ) : products.length === 0 ? (
                        <p className='orders-secondary' role='status'>
                            {maxPrice === null
                                ? 'Ningún producto disponible coincide con la búsqueda.'
                                : `Ningún producto disponible de ${priceFormat.format(maxPrice)} o menos coincide con la búsqueda.`}
                        </p>
                    ) : (
                        <ul>
                            {products.map((product) => (
                                <li key={product.sku}>
                                    <button
                                        type='button'
                                        className='order-picker-option'
                                        aria-pressed={selected?.sku === product.sku}
                                        onClick={() => {
                                            setSelected(product)
                                            setError(null)
                                        }}
                                    >
                                        <span>
                                            <span className='order-picker-name'>{product.nombre}</span>
                                            <span className='orders-secondary codigo'>{product.sku} · {stockText(product)}</span>
                                        </span>
                                        <span className='order-picker-price'>{priceFormat.format(precioParaComparar(product))}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {total > PAGE_SIZE && !listado.cargando && (
                    <p className='orders-secondary'>Se muestran los primeros {PAGE_SIZE} de {total}; escriba más para afinar la búsqueda.</p>
                )}

                {selected && (
                    <div className='order-picker-selection'>
                        <span>Elegido: <strong>{selected.nombre}</strong></span>
                        {askQuantity && (
                            <span className='order-picker-quantity'>
                                <label htmlFor={quantityId}>Cantidad</label>
                                <QuantityStepper
                                    id={quantityId}
                                    value={quantity}
                                    onType={setQuantity}
                                    onStep={(next) => setQuantity(String(next))}
                                    onDone={() => setQuantity(String(aCantidad(quantity)))}
                                    busy={busy}
                                />
                            </span>
                        )}
                    </div>
                )}

                {error && <p className='confirm-dialog-error' role='alert'>{error}</p>}

                <div className='confirm-dialog-actions'>
                    <button type='button' className='confirm-dialog-cancel' onClick={onCancel} disabled={busy}>
                        Volver
                    </button>
                    <button type='button' className='products-button-primary' onClick={confirm} disabled={busy || !selected}>
                        {busy ? busyLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default OrderProductPicker
