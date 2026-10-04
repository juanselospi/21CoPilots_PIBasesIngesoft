import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff, LayoutGrid, List, Pencil, Plus, SlidersHorizontal, X } from 'lucide-react'
import ImportExcel from '../../components/import-excel/ImportExcel.jsx'
import ProductFilters from '../../components/product-filters/ProductFilters.jsx'
import ProductTable from '../../components/product-table/ProductTable.jsx'
import { activeFilterTags, emptyFilters } from '../../components/product-filters/productFilters.js'
import './Products.css'
import AddProduct from '../../components/product-form/AddProduct.jsx'
import EditProduct from '../../components/product-form/EditProduct.jsx'
import { actualizarProducto, crearProducto } from '../../api/catalogo.js'
import { useCategorias } from '../../hooks/useCategorias.js'
import { useListadoAdministrativo } from '../../hooks/useListadoAdministrativo.js'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { toAdminProduct, toModalFields, toServerFields } from './toAdminProduct.js'

// Opciones de orden; el value es lo que entiende el servidor
const sortOptions = [
    { value: 'nombre', label: 'Nombre A–Z' },
    { value: '-nombre', label: 'Nombre Z–A' },
    { value: 'precio', label: 'Precio (menor a mayor)' },
    { value: '-precio', label: 'Precio (mayor a menor)' },
    { value: 'existencias', label: 'Existencias (menor a mayor)' },
    { value: 'sku', label: 'Código' },
]

// Tamaños de página que acepta el servidor
const pageSizes = [24, 48, 96]

// Espera para buscar hasta que el usuario deje de escribir
const SEARCH_DELAY_MS = 300

// Cuántos números de página se muestran a la vez
const PAGE_WINDOW = 5

// Números de página que se muestran alrededor de la actual (empiezan en 0)
const visiblePages = (current, count) => {
    const first = Math.max(0, Math.min(current - Math.floor(PAGE_WINDOW / 2), count - PAGE_WINDOW))
    const last = Math.min(count - 1, first + PAGE_WINDOW - 1)
    return Array.from({ length: last - first + 1 }, (_, index) => first + index)
}

// Página de productos del panel (RF-43): busca, filtra, ordena, pagina, agrega y edita productos.
function Products() {
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')
    const [view, setView] = useState('grid')
    const [sort, setSort] = useState(sortOptions[0].value)
    const [pageSize, setPageSize] = useState(pageSizes[0])
    const [page, setPage] = useState(0)
    const [filters, setFilters] = useState(emptyFilters)
    const [showFilters, setShowFilters] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [creating, setCreating] = useState(false)

    // Busca después de la pausa y vuelve a la primera página
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(search.trim())
            setPage(0)
        }, SEARCH_DELAY_MS)
        return () => clearTimeout(timer)
    }, [search])

    // Las casillas sin marcar no se envían
    const listado = useListadoAdministrativo({
        q: query,
        orden: sort,
        limite: pageSize,
        pagina: page,
        ...filters,
        existenciasBajas: filters.existenciasBajas || undefined,
        margenNegativo: filters.margenNegativo || undefined,
    })
    const products = listado.datos?.datos.map(toAdminProduct) ?? []
    const total = listado.datos?.meta.total ?? 0
    const pageCount = Math.ceil(total / pageSize)
    const firstShown = page * pageSize + 1
    const lastShown = page * pageSize + products.length

    // Categorías que ya existen: opciones del filtro y sugerencias al agregar un producto
    const categorias = useCategorias()
    const categoryNames = categorias.datos?.map(({ nombre }) => nombre) ?? []

    const filterTags = activeFilterTags(filters, priceFormat.format)

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

    const applyFilters = (next) => {
        setFilters(next)
        setPage(0)
        setShowFilters(false)
    }

    const removeFilter = (key) => {
        setFilters({ ...filters, [key]: emptyFilters[key] })
        setPage(0)
    }

    const clearFilters = () => {
        setFilters(emptyFilters)
        setPage(0)
    }

    const clearSearchAndFilters = () => {
        clearSearch()
        clearFilters()
    }

    // Guarda los cambios del producto y recarga el listado.
    // Le devuelve al modal el producto actualizado o el error.
    const handleSave = async (sku, values) => {
        try {
            const actualizado = await actualizarProducto(sku, toServerFields(values))
            listado.recargar()
            return { product: toAdminProduct(actualizado) }
        } catch (error) {
            return { error: error.message, fields: toModalFields(error.detalles?.campos ?? []) }
        }
    }

    // Registra el producto nuevo (RF-01) y recarga el listado.
    // Le devuelve al modal el producto creado o el error.
    const handleCreate = async (values) => {
        try {
            const creado = await crearProducto(toServerFields(values))
            listado.recargar()
            return { product: toAdminProduct(creado) }
        } catch (error) {
            // Código repetido: el servidor no indica el campo, pero siempre es el código
            const fields = error.codigo === 'REGLA_DE_NEGOCIO_VIOLADA'
                ? ['sku']
                : toModalFields(error.detalles?.campos ?? [])
            return { error: error.message, fields }
        }
    }

    return (
        <main className='products'>

            <section className='products-header'>
                <h1>Productos</h1>
                <div className='products-actions'>
                    <ImportExcel onImported={listado.recargar} />
                    <button
                        type='button'
                        className='products-button products-button-primary'
                        onClick={() => setCreating(true)}
                    >
                        <Plus size={20} />Agregar producto
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
                <button
                    type='button'
                    className='products-button'
                    aria-expanded={showFilters}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <SlidersHorizontal size={20} />
                    Filtros{filterTags.length > 0 && ` (${filterTags.length})`}
                </button>

                <div className='products-view-toggle'>
                    <button
                        type='button'
                        className={view === 'grid' ? 'active' : ''}
                        onClick={() => setView('grid')}
                    >
                        <LayoutGrid size={16} />Cuadrícula
                    </button>
                    <button
                        type='button'
                        className={view === 'table' ? 'active' : ''}
                        onClick={() => setView('table')}
                    >
                        <List size={16} />Tabla
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

            {/* key: si cambian los filtros aplicados, el panel arranca de nuevo con ellos */}
            {showFilters && (
                <ProductFilters
                    key={JSON.stringify(filters)}
                    filters={filters}
                    categories={categoryNames}
                    onApply={applyFilters}
                    onClose={() => setShowFilters(false)}
                />
            )}

            {filterTags.length > 0 && (
                <section className='products-active-filters'>
                    {filterTags.map(({ key, label }) => (
                        <span key={key} className='products-filter-tag'>
                            {label}
                            <button type='button' aria-label={`Quitar filtro ${label}`} onClick={() => removeFilter(key)}><X size={16} /></button>
                        </span>
                    ))}
                    <button type='button' className='products-clear-filters' onClick={clearFilters}>Limpiar filtros</button>
                </section>
            )}

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
                query || filterTags.length > 0 ? (
                    <section className='products-empty'>
                        <h2>No hay productos que coincidan</h2>
                        <p>Pruebe con otra búsqueda o quite algunos filtros.</p>
                        <button type='button' className='products-button' onClick={clearSearchAndFilters}>
                            Limpiar búsqueda y filtros
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
                                    {product.image ? (
                                        <img className='products-card-image' src={product.image} alt={product.name} />
                                    ) : (
                                        <div className='products-card-image'><ImageOff size={28} />Sin imagen</div>
                                    )}
                                    <div className='products-card-body'>
                                        <p className='products-card-sku codigo'>{product.sku}</p>
                                        <h3 className='products-card-name'>{product.name}</h3>
                                        <p className='products-card-category'>{product.category}</p>
                                        <p className='products-card-price'>{priceFormat.format(product.price)}</p>
                                        <button
                                            type='button'
                                            className='products-button'
                                            onClick={() => setEditingProduct(product)}
                                        >
                                            <Pencil size={16} />Editar
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </section>
                    ) : (
                        <ProductTable
                            products={products}
                            formatPrice={priceFormat.format}
                            onEdit={setEditingProduct}
                        />
                    )}
                </>
            )}

            <section className='products-pagination'>
                {pageCount > 1 && (
                    <>
                        <button type='button' disabled={page === 0} onClick={() => setPage(page - 1)}>
                            <ChevronLeft size={16} />Anterior
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
                            Siguiente<ChevronRight size={16} />
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
                <EditProduct
                    product={editingProduct}
                    formatPrice={priceFormat.format}
                    onClose={() => setEditingProduct(null)}
                    onSave={handleSave}
                />
            )}

            {creating && (
                <AddProduct
                    categories={categoryNames}
                    formatPrice={priceFormat.format}
                    onClose={() => setCreating(false)}
                    onCreate={handleCreate}
                />
            )}
        </main>
    )
}

export default Products
