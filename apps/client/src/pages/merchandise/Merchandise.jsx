import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PackagePlus, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
// Mismo aspecto que la página de productos, su tabla y sus formularios
import '../products/Products.css'
import '../../components/product-table/ProductTable.css'
import '../../components/product-form/ProductForm.css'
import './Merchandise.css'
import RestockForm from './RestockForm.jsx'
import AdjustmentForm from './AdjustmentForm.jsx'
import { listarParaAdministracion } from '../../api/catalogo.js'
import { registrarAjuste, registrarIngreso } from '../../api/inventario.js'
import { useRecursoRemoto } from '../../hooks/useRecursoRemoto.js'
import { useMovimientos } from '../../hooks/useMovimientos.js'
import { avisarCambioDeInventario } from '../../hooks/useAlertasDeInventario.js'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { toAdminProduct } from '../products/toAdminProduct.js'
import { dateTimeFormat, movementTypes, signedUnits, unitsText } from './merchandiseFormat.js'

// Espera para buscar hasta que el usuario deje de escribir
const SEARCH_DELAY_MS = 300
const SEARCH_RESULTS = 8
// El listado del panel solo acepta 24, 48 o 96 por página
const SEARCH_PAGE_SIZE = 24
const MOVEMENTS_PAGE_SIZE = 25

// Una operación a la vez: lo más común es el ingreso, y es lo que se busca al venir de una alerta
const operations = [
    { key: 'ingreso', label: 'Ingreso', Icon: PackagePlus },
    { key: 'ajuste', label: 'Ajuste', Icon: SlidersHorizontal },
]

// Productos del panel por código o nombre; sin texto no pide nada.
// Ordenados por código, el que coincide exacto queda antes que los que lo contienen.
const searchProducts = (q, signal) =>
    q ? listarParaAdministracion({ q, orden: 'sku', limite: SEARCH_PAGE_SIZE }, { signal }) : Promise.resolve(null)

// Pantalla «Ingreso de mercancía» del panel (HU-07, HU-08): ingreso, ajuste e historial en una sola pantalla.
function Merchandise() {
    // El producto elegido vive en la URL: las alertas de inventario abren /admin/mercancia?sku=…
    const [searchParams, setSearchParams] = useSearchParams()
    const sku = searchParams.get('sku')?.trim().toUpperCase() || null
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')
    // Existencias después de registrar. No se recarga el producto: mientras carga
    // se desmontarían los formularios y se perdería el mensaje «Quedan N unidades».
    const [stockBySku, setStockBySku] = useState({})
    const [operation, setOperation] = useState(operations[0].key)

    useEffect(() => {
        const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DELAY_MS)
        return () => clearTimeout(timer)
    }, [search])

    const results = useRecursoRemoto((signal) => searchProducts(query, signal), [query])
    const found = results.datos?.datos.map(toAdminProduct).slice(0, SEARCH_RESULTS) ?? []

    const selected = useRecursoRemoto((signal) => searchProducts(sku, signal), [sku])
    const loaded = selected.datos?.datos.map(toAdminProduct).find((product) => product.sku === sku)
    const product = loaded && { ...loaded, stock: stockBySku[loaded.sku] ?? loaded.stock }

    const movements = useMovimientos({ sku: sku ?? undefined, limite: MOVEMENTS_PAGE_SIZE })
    const movementList = movements.datos?.datos ?? []

    const selectProduct = (code) => {
        setStockBySku({})
        setSearch('')
        setQuery('')
        setSearchParams({ sku: code })
    }

    // Desde el historial: elige el producto del movimiento y sube al formulario
    const selectFromHistory = (code) => {
        selectProduct(code)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const changeProduct = () => {
        setStockBySku({})
        setSearchParams({})
    }

    // Registra en el servidor; si sale bien actualiza las existencias, el historial y el contador de alertas
    const register = (send) => async (values) => {
        try {
            const movement = await send({ sku: product.sku, ...values })
            setStockBySku((current) => ({ ...current, [movement.sku]: movement.existencias }))
            movements.recargar()
            avisarCambioDeInventario()
            return { movement }
        } catch (error) {
            return { error: error.message, fields: error.detalles?.campos ?? [] }
        }
    }

    return (
        <main className='products'>
            <section className='products-header'>
                <h1>Ingreso de mercancía</h1>
            </section>

            <section className='merchandise-card'>
                {sku && selected.cargando ? (
                    <p className='merchandise-help' role='status'>Cargando producto…</p>
                ) : product ? (
                    <div className='merchandise-selected'>
                        <div>
                            <p className='codigo merchandise-sku'>{product.sku}</p>
                            <h2>{product.name}</h2>
                            <p className='merchandise-help'>{product.category}</p>
                        </div>
                        <div className='merchandise-stock'>
                            <span>Existencias</span>
                            <strong>{unitsText(product.stock)}</strong>
                        </div>
                        <button type='button' className='products-button' onClick={changeProduct}>
                            <RefreshCw size={16} />Cambiar producto
                        </button>
                    </div>
                ) : (
                    <>
                        {sku && (
                            <p className='product-form-alert' role='alert'>
                                {selected.error ?? `No se encontró el producto ${sku}. Búsquelo por código o nombre.`}
                            </p>
                        )}
                        <label className='product-form-field'>
                            <span>Producto</span>
                            <div className='product-form-input'>
                                <Search size={18} className='merchandise-search-icon' />
                                <input
                                    type='search'
                                    placeholder='Buscar por código o nombre…'
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </div>
                        </label>
                        {query && (results.cargando ? (
                            <p className='merchandise-help' role='status'>Buscando…</p>
                        ) : results.error ? (
                            <p className='product-form-alert' role='alert'>{results.error}</p>
                        ) : found.length === 0 ? (
                            <p className='merchandise-help'>No hay productos que coincidan con «{query}».</p>
                        ) : (
                            <ul className='merchandise-results' aria-label='Productos encontrados'>
                                {found.map((match) => (
                                    <li key={match.sku}>
                                        <button type='button' onClick={() => selectProduct(match.sku)}>
                                            <span className='codigo merchandise-sku'>{match.sku}</span>
                                            <span className='merchandise-result-name'>{match.name}</span>
                                            <span className='merchandise-help'>{unitsText(match.stock)}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ))}
                    </>
                )}
            </section>

            {/* key: con otro producto el formulario arranca de nuevo, con su costo */}
            {product && (
                <section className='merchandise-operation' key={product.sku}>
                    <div className='products-view-toggle merchandise-toggle' role='tablist' aria-label='Operación'>
                        {operations.map(({ key, label, Icon }) => (
                            <button
                                key={key}
                                type='button'
                                role='tab'
                                id={`merchandise-tab-${key}`}
                                aria-selected={operation === key}
                                aria-controls='merchandise-panel'
                                className={operation === key ? 'active' : ''}
                                onClick={() => setOperation(key)}
                            >
                                <Icon size={16} />{label}
                            </button>
                        ))}
                    </div>
                    <div id='merchandise-panel' role='tabpanel' aria-labelledby={`merchandise-tab-${operation}`}>
                        {operation === 'ingreso'
                            ? <RestockForm product={product} onRegister={register(registrarIngreso)} />
                            : <AdjustmentForm onRegister={register(registrarAjuste)} />}
                    </div>
                </section>
            )}

            <section className='merchandise-history'>
                <h2>Movimientos recientes{product && ` de ${product.name}`}</h2>
                {movements.cargando ? (
                    <p className='products-status' role='status'>Cargando movimientos…</p>
                ) : movements.error ? (
                    <div className='products-status products-status-error' role='alert'>
                        <p>{movements.error}</p>
                        <button type='button' className='products-status-button' onClick={movements.recargar}>
                            Reintentar
                        </button>
                    </div>
                ) : movementList.length === 0 ? (
                    <p className='products-status'>Todavía no hay movimientos.</p>
                ) : (
                    <div className='product-table-wrapper'>
                        <table className='product-table'>
                            <thead>
                                <tr>
                                    <th scope='col'>Fecha</th>
                                    <th scope='col'>Producto</th>
                                    <th scope='col'>Tipo</th>
                                    <th scope='col' className='product-table-number'>Cantidad</th>
                                    <th scope='col' className='product-table-number'>Costo unitario</th>
                                    <th scope='col'>Motivo</th>
                                    <th scope='col'>Responsable</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movementList.map((movement, index) => {
                                    const type = movementTypes[movement.tipo] ?? { label: movement.tipo, className: 'chip' }
                                    return (
                                        // Sin producto elegido, la fila elige el suyo; el botón del nombre es para el teclado
                                        <tr
                                            key={`${movement.fecha}-${movement.sku}-${index}`}
                                            className={product ? undefined : 'merchandise-row-selectable'}
                                            onClick={product ? undefined : () => selectFromHistory(movement.sku)}
                                        >
                                            <td className='merchandise-nowrap'>{dateTimeFormat.format(new Date(movement.fecha))}</td>
                                            <td>
                                                {product ? movement.nombre : (
                                                    <button
                                                        type='button'
                                                        className='merchandise-product-link'
                                                        aria-label={`Registrar mercancía de ${movement.nombre}`}
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            selectFromHistory(movement.sku)
                                                        }}
                                                    >
                                                        {movement.nombre}
                                                    </button>
                                                )}
                                                <span className='codigo merchandise-sku'>{movement.sku}</span>
                                            </td>
                                            <td><span className={type.className}>{type.label}</span></td>
                                            <td className='product-table-number'>{signedUnits(movement.cantidad)}</td>
                                            <td className='product-table-number'>
                                                {movement.costoUnitario === null ? '—' : priceFormat.format(movement.costoUnitario)}
                                            </td>
                                            <td className='merchandise-reason'>{movement.motivo || '—'}</td>
                                            <td>{movement.responsable ?? '—'}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    )
}

export default Merchandise
