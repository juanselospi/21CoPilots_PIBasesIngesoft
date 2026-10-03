import { useEffect, useState } from 'react'
import ImportExcel from '../../components/import-excel/ImportExcel.jsx'
import './Products.css'
import ProductEditModal from '../../components/product-edit-modal/ProductEditModal.jsx'
import { useListadoAdministrativo } from '../../hooks/useListadoAdministrativo.js'
import { toAdminProduct } from './toAdminProduct.js'

const priceFormat = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
})

// Las claves son las que acepta el servidor en `orden` (RF-43)
const sortOptions = [
    { value: 'nombre', label: 'Nombre A–Z' },
    { value: '-nombre', label: 'Nombre Z–A' },
    { value: 'precio', label: 'Precio (menor a mayor)' },
    { value: '-precio', label: 'Precio (mayor a menor)' },
    { value: 'existencias', label: 'Existencias (menor a mayor)' },
    { value: 'sku', label: 'Código' },
]

// Los únicos tamaños de página que acepta el servidor
const pageSizes = [24, 48, 96]

// Espera a que el usuario deje de escribir antes de buscar
const SEARCH_DELAY_MS = 300

// Cuántos números de página se muestran a la vez
const PAGE_WINDOW = 5

// TODO: leer de la configuración del negocio que entregue la API (RES-06)
const taxRate = 13

// Números de página alrededor de la actual; empiezan en 0 como en el servidor
const visiblePages = (current, count) => {
    const first = Math.max(0, Math.min(current - Math.floor(PAGE_WINDOW / 2), count - PAGE_WINDOW))
    const last = Math.min(count - 1, first + PAGE_WINDOW - 1)
    return Array.from({ length: last - first + 1 }, (_, index) => first + index)
}

// Listado del panel (RF-43). Es el contenedor: pide los productos al servidor
// con la búsqueda, el orden y la página, y los pasa traducidos a la tarjeta.
function Products() {
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')
    const [view, setView] = useState('grid')
    const [sort, setSort] = useState(sortOptions[0].value)
    const [pageSize, setPageSize] = useState(pageSizes[0])
    const [page, setPage] = useState(0)
    const [editingProduct, setEditingProduct] = useState(null)

    // Una búsqueda nueva vuelve a la primera página
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(search.trim())
            setPage(0)
        }, SEARCH_DELAY_MS)
        return () => clearTimeout(timer)
    }, [search])

    const listado = useListadoAdministrativo({ q: query, orden: sort, limite: pageSize, pagina: page })
    const products = listado.datos?.datos.map(toAdminProduct) ?? []
    const total = listado.datos?.meta.total ?? 0
    const pageCount = Math.ceil(total / pageSize)
    const firstShown = page * pageSize + 1
    const lastShown = page * pageSize + products.length

    const changeSort = (value) => {
        setSort(value)
        setPage(0)
    }

    const changePageSize = (value) => {
        setPageSize(value)
        setPage(0)
    }

    const clearSearch = () => {
        setSearch('')
        setQuery('')
        setPage(0)
    }

    // TODO: enviar los cambios a la API; el servidor recalcula el precio (RF-51)
    const handleSave = () => setEditingProduct(null)

    return (
        <main className='products'>

            <section className='products-header'>
                <h1>Productos</h1>
                <div className='products-actions'>
                    <ImportExcel onImported={listado.recargar} />
                    <button type='button' className='products-button products-button-primary'>
                        + Agregar producto
                    </button>
                </div>
            </section>

            <input
                type='search'
                className='products-search'
                placeholder='Buscar por nombre o código...'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
            />

            <section className='products-toolbar'>
                {/* TODO: panel de filtros (categoría, disponibilidad, existencias bajas, margen negativo, precio) */}
                <button type='button' className='products-button'>
                    Filtros
                </button>

                <div className='products-view-toggle'>
                    <button
                        type='button'
                        className={view === 'grid' ? 'active' : ''}
                        onClick={() => setView('grid')}
                    >
                        Cuadrícula
                    </button>
                    <button
                        type='button'
                        className={view === 'table' ? 'active' : ''}
                        onClick={() => setView('table')}
                    >
                        Tabla
                    </button>
                </div>

                <select
                    className='products-sort'
                    value={sort}
                    onChange={(event) => changeSort(event.target.value)}
                >
                    {sortOptions.map(({ value, label }) => (
                        <option key={value} value={value}>Ordenar: {label}</option>
                    ))}
                </select>
            </section>

            {listado.cargando ? (
                <p className='products-status' role='status'>Cargando productos…</p>
            ) : listado.error ? (
                <div className='products-status products-status-error' role='alert'>
                    <p>{listado.error}</p>
                    <button type='button' className='products-status-button' onClick={listado.recargar}>
                        Reintentar
                    </button>
                </div>
            ) : products.length === 0 ? (
                query ? (
                    <section className='products-empty'>
                        <h2>No hay productos que coincidan</h2>
                        <p>Pruebe con otro término de búsqueda.</p>
                        <button type='button' className='products-button' onClick={clearSearch}>
                            Limpiar búsqueda
                        </button>
                    </section>
                ) : (
                    <section className='products-empty'>
                        <h2>Todavía no hay productos</h2>
                        <p>Cárguelos desde un Excel o agréguelos uno por uno.</p>
                    </section>
                )
            ) : (
                <>
                    <p className='products-count'>
                        {total} productos · mostrando {firstShown}–{lastShown}
                    </p>

                    {view === 'grid' ? (
                        // TODO: extraer la tarjeta administrativa a components/ (código, semáforo, etiquetas, "Ingresar mercancía")
                        <section className='products-grid'>
                            {products.map((product) => (
                                <article key={product.sku} className='products-card'>
                                    <div className='products-card-image'>imagen</div>
                                    <div className='products-card-body'>
                                        <p className='products-card-sku'>{product.sku}</p>
                                        <h3 className='products-card-name'>{product.name}</h3>
                                        <p className='products-card-category'>{product.category}</p>
                                        <p className='products-card-price'>{priceFormat.format(product.price)}</p>
                                        <button
                                            type='button'
                                            className='products-button'
                                            onClick={() => setEditingProduct(product)}
                                        >
                                            Editar
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </section>
                    ) : (
                        // TODO: vista de tabla (Código · Nombre · Categoría · Precio · Existencias · Etiquetas)
                        <section className='products-table-placeholder'>Vista de tabla pendiente</section>
                    )}
                </>
            )}

            <section className='products-pagination'>
                {pageCount > 1 && (
                    <>
                        <button type='button' disabled={page === 0} onClick={() => setPage(page - 1)}>
                            ‹ Anterior
                        </button>
                        {visiblePages(page, pageCount).map((number) => (
                            <button
                                key={number}
                                type='button'
                                className={number === page ? 'active' : ''}
                                aria-current={number === page ? 'page' : undefined}
                                onClick={() => setPage(number)}
                            >
                                {number + 1}
                            </button>
                        ))}
                        <button type='button' disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)}>
                            Siguiente ›
                        </button>
                    </>
                )}

                <select
                    className='products-page-size'
                    value={pageSize}
                    onChange={(event) => changePageSize(Number(event.target.value))}
                >
                    {pageSizes.map((size) => (
                        <option key={size} value={size}>{size} por página</option>
                    ))}
                </select>
            </section>

            {editingProduct && (
                <ProductEditModal
                    product={editingProduct}
                    taxRate={taxRate}
                    onClose={() => setEditingProduct(null)}
                    onSave={handleSave}
                />
            )}
        </main>
    )
}

export default Products
