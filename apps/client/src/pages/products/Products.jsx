import { useEffect, useState } from 'react'
import {
    Archive, ArchiveRestore, ChevronDown, ChevronLeft, ChevronRight, ImageOff, LayoutGrid, List, Pencil, Plus, SlidersHorizontal, Trash2, X,
} from 'lucide-react'
import ImportExcel from '../../components/import-excel/ImportExcel.jsx'
import ProductFilters from '../../components/product-filters/ProductFilters.jsx'
import ProductTable from '../../components/product-table/ProductTable.jsx'
import Select from '../../components/select/Select.jsx'
import { activeFilterTags, emptyFilters, filterParams } from '../../components/product-filters/productFilters.js'
import './Products.css'
import AddProduct from '../../components/product-form/AddProduct.jsx'
import EditProduct from '../../components/product-form/EditProduct.jsx'
import ProductActionDialog from '../../components/product-form/ProductActionDialog.jsx'
import { actualizarProducto, cambiarEstadoProducto, crearFamilia, crearProducto, eliminarProducto } from '../../api/catalogo.js'
import { useCategorias } from '../../hooks/useCategorias.js'
import { useFamilias } from '../../hooks/useFamilias.js'
import { avisarCambioDeInventario } from '../../hooks/useAlertasDeInventario.js'
import { useListadoAdministrativo } from '../../hooks/useListadoAdministrativo.js'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { toAdminProduct, toFamilyOption, toModalFields, toServerFields } from './toAdminProduct.js'
import { familyErrorFields, toServerFamily } from '../families/toAdminFamily.js'
import { paginasVisibles } from '../../utils/paginas.js'

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
    // Acción esperando confirmación: { action: 'desactivar' | 'reactivar' | 'eliminar', product }
    const [pendingAction, setPendingAction] = useState(null)

    // Busca después de la pausa y vuelve a la primera página
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(search.trim())
            setPage(0)
        }, SEARCH_DELAY_MS)
        return () => clearTimeout(timer)
    }, [search])

    const listado = useListadoAdministrativo({
        q: query,
        orden: sort,
        limite: pageSize,
        pagina: page,
        ...filterParams(filters),
    })
    const products = listado.datos?.datos.map(toAdminProduct) ?? []
    const total = listado.datos?.meta.total ?? 0
    const pageCount = Math.ceil(total / pageSize)
    const firstShown = page * pageSize + 1
    const lastShown = page * pageSize + products.length

    // Categorías que ya existen: opciones del filtro
    const categorias = useCategorias()
    const categoryNames = categorias.datos?.map(({ nombre }) => nombre) ?? []

    // Familias con su importación y margen: selector y precios heredados al agregar y al editar
    const familias = useFamilias()
    const families = familias.datos?.map(toFamilyOption) ?? []

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
            if (Object.hasOwn(values, 'stock')) avisarCambioDeInventario()
            return { product: toAdminProduct(actualizado) }
        } catch (error) {
            return { error: error.message, fields: toModalFields(error.detalles?.campos ?? []) }
        }
    }

    // Registra el producto nuevo y recarga el listado.
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

    // Crea una familia desde «Agregar producto» y recarga las familias.
    // Le devuelve al modal la familia creada o el error.
    const handleCreateFamily = async (values) => {
        try {
            const creada = await crearFamilia(toServerFamily(values))
            familias.recargar()
            return { family: toFamilyOption(creada) }
        } catch (error) {
            return { error: error.message, fields: familyErrorFields(error) }
        }
    }

    // Desactiva, reactiva o elimina el producto, cierra el diálogo y recarga el listado.
    // Si falla, le devuelve al diálogo el error; un 409 al eliminar es que tiene historial.
    const handleAction = async (action, product) => {
        try {
            if (action === 'eliminar') await eliminarProducto(product.sku)
            else await cambiarEstadoProducto(product.sku, action === 'desactivar' ? 'descontinuado' : 'activo')
            setPendingAction(null)
            listado.recargar()
            // Un producto descontinuado o eliminado deja de contar en las alertas
            avisarCambioDeInventario()
            return {}
        } catch (error) {
            return { error: error.message, withHistory: action === 'eliminar' && error.estado === 409 }
        }
    }

    const askAction = (action, product) => setPendingAction({ action, product })

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
                    aria-controls='products-filters'
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <SlidersHorizontal size={20} />
                    Filtros{filterTags.length > 0 && ` (${filterTags.length})`}
                    <ChevronDown size={16} className='products-button-chevron' aria-hidden='true' />
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

                <Select
                    className='products-sort'
                    aria-label='Ordenar productos'
                    value={sort}
                    onChange={changeSort}
                    options={sortOptions.map(({ value, label }) => ({ value, label: `Ordenar: ${label}` }))}
                />
            </section>

            {/* Siempre montado para animar la apertura y el cierre; se despliega con `open` */}
            <ProductFilters
                id='products-filters'
                open={showFilters}
                filters={filters}
                categories={categoryNames}
                onApply={applyFilters}
                onClose={() => setShowFilters(false)}
            />

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
                                        {product.discontinued && (
                                            <span className='chip products-card-chip'><Archive size={16} />Descontinuado</span>
                                        )}
                                        <p className='products-card-price'>{priceFormat.format(product.price)}</p>
                                        <div className='products-card-actions'>
                                            <button
                                                type='button'
                                                className='products-button'
                                                onClick={() => setEditingProduct(product)}
                                            >
                                                <Pencil size={16} />Editar
                                            </button>
                                            {product.discontinued ? (
                                                <button
                                                    type='button'
                                                    className='products-button'
                                                    onClick={() => askAction('reactivar', product)}
                                                >
                                                    <ArchiveRestore size={16} />Reactivar
                                                </button>
                                            ) : (
                                                <button
                                                    type='button'
                                                    className='products-button'
                                                    onClick={() => askAction('desactivar', product)}
                                                >
                                                    <Archive size={16} />Desactivar
                                                </button>
                                            )}
                                            <button
                                                type='button'
                                                className='products-button products-button-danger'
                                                onClick={() => askAction('eliminar', product)}
                                            >
                                                <Trash2 size={16} />Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </section>
                    ) : (
                        <ProductTable
                            products={products}
                            formatPrice={priceFormat.format}
                            onEdit={setEditingProduct}
                            onAction={askAction}
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
                        {paginasVisibles(page, pageCount).map((number) => (
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

                <Select
                    className='products-page-size'
                    aria-label='Productos por página'
                    value={pageSize}
                    onChange={(value) => changePageSize(Number(value))}
                    options={pageSizes.map((size) => ({ value: size, label: `${size} por página` }))}
                />
            </section>

            {editingProduct && (
                <EditProduct
                    product={editingProduct}
                    families={families}
                    formatPrice={priceFormat.format}
                    onClose={() => setEditingProduct(null)}
                    onSave={handleSave}
                />
            )}

            {pendingAction && (
                <ProductActionDialog
                    action={pendingAction.action}
                    product={pendingAction.product}
                    onClose={() => setPendingAction(null)}
                    onConfirm={handleAction}
                />
            )}

            {creating && (
                <AddProduct
                    families={families}
                    formatPrice={priceFormat.format}
                    onClose={() => setCreating(false)}
                    onCreate={handleCreate}
                    onCreateFamily={handleCreateFamily}
                />
            )}
        </main>
    )
}

export default Products
