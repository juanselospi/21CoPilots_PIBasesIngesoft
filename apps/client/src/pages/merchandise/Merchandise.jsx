import { useEffect, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { ChevronDown, Info, PackagePlus, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
// Mismo aspecto que la página de productos, su tabla y sus formularios
import '../products/Products.css'
import '../../components/product-table/ProductTable.css'
import '../../components/product-form/ProductForm.css'
import './Merchandise.css'
import RestockForm from './RestockForm.jsx'
import AdjustmentForm from './AdjustmentForm.jsx'
import ProductFilters from '../../components/product-filters/ProductFilters.jsx'
import { activeFilterTags, emptyFilters, filterParams } from '../../components/product-filters/productFilters.js'
import { listarParaAdministracion } from '../../api/catalogo.js'
import { registrarAjuste, registrarIngreso } from '../../api/inventario.js'
import { useRecursoRemoto } from '../../hooks/useRecursoRemoto.js'
import { useFamilias } from '../../hooks/useFamilias.js'
import { useMovimientos } from '../../hooks/useMovimientos.js'
import { useIrAlListado } from '../../hooks/useIrAlListado.js'
import { avisarCambioDeInventario } from '../../hooks/useAlertasDeInventario.js'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { toAdminProduct } from '../products/toAdminProduct.js'
import { dateTimeFormat, movementTypes, signedUnits, unitsText } from './merchandiseFormat.js'
import Pagination from '../../components/pagination/Pagination.jsx'
import Select from '../../components/select/Select.jsx'
import BackButton from '../../components/back-button/BackButton.jsx'
import { backState } from '../../routes.js'

// Espera para buscar hasta que el usuario deje de escribir
const SEARCH_DELAY_MS = 300
// El listado del panel solo acepta 24, 48 o 96 por página; más que eso, mejor afinar la búsqueda
const SEARCH_PAGE_SIZE = 24
const MOVEMENTS_PAGE_SIZE = 25

// Una operación a la vez: lo más común es el ingreso, y es lo que se busca al venir de una alerta
const operations = [
    { key: 'ingreso', label: 'Ingreso', Icon: PackagePlus, after: 'Después del ingreso' },
    { key: 'ajuste', label: 'Ajuste', Icon: SlidersHorizontal, after: 'Después del ajuste' },
]

// Productos del panel por código o nombre y con los mismos filtros que Productos.
// Sin texto ni filtros no pide nada. Ordenados por código: el que coincide exacto queda primero.
const searchProducts = (q, filters, signal, pagina = 0) =>
    q || activeFilterTags(filters, String).length > 0
        ? listarParaAdministracion(
            { q: q || undefined, ...filterParams(filters), orden: 'sku', limite: SEARCH_PAGE_SIZE, pagina },
            { signal },
        )
        : Promise.resolve(null)

// Pantalla «Ingreso de mercancía» del panel (HU-07, HU-08): ingreso, ajuste e historial en una sola pantalla.
function Merchandise() {
    // El producto elegido vive en la URL: las alertas de inventario abren /admin/mercancia?sku=...
    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()
    const sku = searchParams.get('sku')?.trim().toUpperCase() || null
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')
    // Existencias después de registrar. No se recarga el producto: mientras carga
    // se desmontarían los formularios y se perdería el mensaje «Quedan N unidades».
    const [stockBySku, setStockBySku] = useState({})
    const [operation, setOperation] = useState(operations[0].key)
    // Existencias que quedarían con lo escrito en el formulario; null si todavía no se sabe
    const [preview, setPreview] = useState(null)
    const [historyType, setHistoryType] = useState('')
    const [historyPage, setHistoryPage] = useState(0)
    // Se quedan al cambiar de producto, para volver a la misma lista filtrada
    const [filters, setFilters] = useState(emptyFilters)
    const [showFilters, setShowFilters] = useState(false)
    const [resultsPage, setResultsPage] = useState(0)

    useEffect(() => {
        // Otra búsqueda empieza en la primera página de resultados
        const timer = setTimeout(() => {
            setQuery(search.trim())
            setResultsPage(0)
        }, SEARCH_DELAY_MS)
        return () => clearTimeout(timer)
    }, [search])

    const familias = useFamilias()
    // Solo las familias activas: las desactivadas confunden en el filtro de Categoría
    const familyNames = familias.datos?.filter(({ activa }) => activa).map(({ nombre }) => nombre) ?? []
    const filterTags = activeFilterTags(filters, priceFormat.format)
    const searching = query !== '' || filterTags.length > 0

    const results = useRecursoRemoto(
        (signal) => searchProducts(query, filters, signal, resultsPage),
        [query, filters, resultsPage],
    )
    const found = results.datos?.datos.map(toAdminProduct) ?? []
    const foundTotal = results.datos?.meta.total ?? 0
    const resultsPageCount = Math.max(1, Math.ceil(foundTotal / SEARCH_PAGE_SIZE))
    const firstShown = resultsPage * SEARCH_PAGE_SIZE + 1

    // Otra página de resultados: cuando llega, la vista sube al inicio de la búsqueda
    // (la tarjeta, que no se desmonta al cargar) en vez de quedar en el historial
    const searchCardRef = useRef(null)
    const goToResults = useIrAlListado(searchCardRef, !results.cargando)
    const changeResultsPage = (next) => {
        if (next === resultsPage) return
        setResultsPage(next)
        goToResults()
    }

    const selected = useRecursoRemoto((signal) => searchProducts(sku, emptyFilters, signal), [sku])
    const loaded = selected.datos?.datos.map(toAdminProduct).find((product) => product.sku === sku)
    const product = loaded && { ...loaded, stock: stockBySku[loaded.sku] ?? loaded.stock }

    const movements = useMovimientos({
        sku: sku ?? undefined,
        tipo: historyType || undefined,
        pagina: historyPage,
        limite: MOVEMENTS_PAGE_SIZE,
    })
    const movementList = movements.datos?.datos ?? []
    const movementTotal = movements.datos?.meta.total ?? 0
    const pageCount = Math.max(1, Math.ceil(movementTotal / MOVEMENTS_PAGE_SIZE))

    // Otro producto: formulario, proyección e historial empiezan de nuevo
    const selectProduct = (code) => {
        setStockBySku({})
        setPreview(null)
        setHistoryPage(0)
        setSearch('')
        setQuery('')
        // Con producto, la flecha del título vuelve a esta vista (la búsqueda y los filtros siguen montados)
        setSearchParams(code ? { sku: code } : {}, code ? { state: backState(location) } : undefined)
    }

    // Desde el historial: elige el producto del movimiento y sube al formulario
    const selectFromHistory = (code) => {
        selectProduct(code)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Otros filtros empiezan en la primera página de resultados
    const changeFilters = (next) => {
        setFilters(next)
        setResultsPage(0)
    }

    const applyFilters = (next) => {
        changeFilters(next)
        setShowFilters(false)
    }

    const removeFilter = (key) => changeFilters({ ...filters, [key]: emptyFilters[key] })

    const changeOperation = (key) => {
        setOperation(key)
        setPreview(null)
    }

    const changeHistoryType = (type) => {
        setHistoryType(type)
        setHistoryPage(0)
    }

    // Registra en el servidor; si sale bien actualiza las existencias, el historial y el contador de alertas
    const register = (send) => async (values) => {
        try {
            const movement = await send({ sku: product.sku, ...values })
            setStockBySku((current) => ({ ...current, [movement.sku]: movement.existencias }))
            setHistoryPage(0)
            movements.recargar()
            avisarCambioDeInventario()
            return { movement }
        } catch (error) {
            return { error: error.message, fields: error.detalles?.campos ?? [] }
        }
    }

    const afterLabel = operations.find(({ key }) => key === operation).after

    return (
        <main className='products'>
            <section className='products-header'>
                {sku ? (
                    <div className='back-title'>
                        <BackButton fallback='/admin/mercancia' />
                        <h1>Ingreso de mercancía</h1>
                    </div>
                ) : (
                    <h1>Ingreso de mercancía</h1>
                )}
            </section>

            <section ref={searchCardRef} className='merchandise-card merchandise-search-card'>
                {sku && selected.cargando ? (
                    <p className='merchandise-help' role='status'>Cargando producto…</p>
                ) : product ? (
                    <div className='merchandise-selected'>
                        <div>
                            <p className='merchandise-help'>
                                <span className='codigo'>{product.sku}</span> · {product.category}
                            </p>
                            <h2>{product.name}</h2>
                        </div>
                        <button type='button' className='products-button' onClick={() => selectProduct(null)}>
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
                        <label className='product-form-field' htmlFor='merchandise-search'>Producto</label>
                        <div className='merchandise-search-row'>
                            <div className='product-form-input'>
                                <Search size={18} className='merchandise-search-icon' />
                                <input
                                    id='merchandise-search'
                                    type='search'
                                    placeholder='Buscar por código o nombre…'
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </div>
                            <button
                                type='button'
                                className='products-button'
                                aria-expanded={showFilters}
                                aria-controls='merchandise-filters'
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <SlidersHorizontal size={18} />
                                Filtros{filterTags.length > 0 && ` (${filterTags.length})`}
                                <ChevronDown size={16} className='products-button-chevron' aria-hidden='true' />
                            </button>
                        </div>

                        {/* El mismo panel de filtros de Productos, siempre montado para animar la apertura y el cierre */}
                        <ProductFilters
                            id='merchandise-filters'
                            open={showFilters}
                            filters={filters}
                            categories={familyNames}
                            onApply={applyFilters}
                            onClose={() => setShowFilters(false)}
                        />

                        {filterTags.length > 0 && (
                            <div className='products-active-filters'>
                                {filterTags.map(({ key, label }) => (
                                    <span key={key} className='products-filter-tag'>
                                        {label}
                                        <button type='button' aria-label={`Quitar filtro ${label}`} onClick={() => removeFilter(key)}>
                                            <X size={16} />
                                        </button>
                                    </span>
                                ))}
                                <button type='button' className='products-clear-filters' onClick={() => changeFilters(emptyFilters)}>
                                    Limpiar filtros
                                </button>
                            </div>
                        )}

                        {searching && (results.cargando ? (
                            <p className='merchandise-help' role='status'>Buscando…</p>
                        ) : results.error ? (
                            <p className='product-form-alert' role='alert'>{results.error}</p>
                        ) : found.length === 0 ? (
                            <p className='merchandise-help'>
                                {query ? `No hay productos que coincidan con «${query}»` : 'No hay productos que coincidan'}
                                {filterTags.length > 0 && ' con estos filtros'}.
                            </p>
                        ) : (
                            <>
                                <p className='merchandise-help'>
                                    {foundTotal === 1
                                        ? '1 producto'
                                        : `${foundTotal} productos · mostrando ${firstShown}–${firstShown + found.length - 1}`}
                                </p>
                                <ul className='merchandise-results' aria-label='Productos encontrados'>
                                    {found.map((match) => (
                                        <li key={match.sku}>
                                            <button type='button' onClick={() => selectProduct(match.sku)}>
                                                <span className='codigo merchandise-sku'>{match.sku}</span>
                                                <span>
                                                    <span className='merchandise-result-name'>{match.name}</span>
                                                    <span className='merchandise-result-family'>{match.category}</span>
                                                </span>
                                                <span className='merchandise-help'>{unitsText(match.stock)}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <Pagination
                                    className='merchandise-pagination'
                                    label='Páginas de resultados'
                                    page={resultsPage}
                                    pageCount={resultsPageCount}
                                    onChange={changeResultsPage}
                                />
                            </>
                        ))}
                    </>
                )}
            </section>

            {/* key: con otro producto el formulario arranca de nuevo, con su costo */}
            {product && (
                <section className='merchandise-operation' key={product.sku}>
                    {/* El selector va en su propia fila: así el formulario y el resumen empiezan a la misma altura */}
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
                                onClick={() => changeOperation(key)}
                            >
                                <Icon size={16} />{label}
                            </button>
                        ))}
                    </div>

                    {/* Mitad y mitad: el formulario y, al lado, cuántas unidades quedarían */}
                    <div className='merchandise-operation-grid'>
                        <div id='merchandise-panel' role='tabpanel' aria-labelledby={`merchandise-tab-${operation}`}>
                            {operation === 'ingreso' ? (
                                <RestockForm product={product} onRegister={register(registrarIngreso)} onPreview={setPreview} />
                            ) : (
                                <AdjustmentForm product={product} onRegister={register(registrarAjuste)} onPreview={setPreview} />
                            )}
                        </div>

                        <aside className='merchandise-card merchandise-summary' aria-label='Resumen de inventario'>
                            <h2>Resumen de inventario</h2>
                            <div className='merchandise-summary-row'>
                                <span>Existencias actuales</span>
                                <strong>{unitsText(product.stock)}</strong>
                            </div>
                            <div className='merchandise-summary-row'>
                                <span>{afterLabel}</span>
                                <strong
                                    className={preview === null || preview === product.stock
                                        ? undefined
                                        : preview < 0 ? 'merchandise-negative' : preview > product.stock ? 'merchandise-up' : 'merchandise-down'}
                                >
                                    {preview === null ? '—' : unitsText(preview)}
                                </strong>
                            </div>
                            {preview !== null && preview < 0 && (
                                <p className='product-form-error'>No alcanza: solo hay {unitsText(product.stock)}.</p>
                            )}
                            <p className='merchandise-help merchandise-summary-note'>
                                <Info size={16} />Las existencias cambian solo al confirmar el movimiento.
                            </p>
                        </aside>
                    </div>
                </section>
            )}

            <section className='merchandise-history'>
                <div className='merchandise-history-header'>
                    <h2>Movimientos recientes{product && ` de ${product.name}`}</h2>
                    <label className='merchandise-history-filter'>
                        <span>Tipo</span>
                        <Select
                            className='products-sort'
                            value={historyType}
                            onChange={changeHistoryType}
                            options={[
                                { value: '', label: 'Todos' },
                                ...Object.entries(movementTypes).map(([key, { label }]) => ({ value: key, label })),
                            ]}
                        />
                    </label>
                </div>

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
                    <p className='products-status'>
                        {historyType ? 'No hay movimientos de este tipo.' : 'Todavía no hay movimientos.'}
                    </p>
                ) : (
                    <>
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

                        <Pagination
                            className='merchandise-pagination'
                            label='Páginas del historial'
                            page={historyPage}
                            pageCount={pageCount}
                            onChange={setHistoryPage}
                            summary={movementTotal === 1 ? '1 movimiento' : `${movementTotal} movimientos`}
                        />
                    </>
                )}
            </section>
        </main>
    )
}

export default Merchandise
