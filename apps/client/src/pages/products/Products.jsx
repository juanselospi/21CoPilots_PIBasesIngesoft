import { useState } from 'react'
import './Products.css'
import { products } from '../../data/products.js'
import ProductEditModal from '../../components/product-edit-modal/ProductEditModal.jsx'

const priceFormat = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
})

// TODO: poblar desde el panel de filtros y quitar los valores de ejemplo
const activeFilters = ['Coleccionables', 'Existencias bajas']

const sortOptions = [
    { value: 'name-asc', label: 'Nombre A–Z' },
    { value: 'name-desc', label: 'Nombre Z–A' },
    { value: 'price', label: 'Precio' },
    { value: 'stock', label: 'Existencias (menor a mayor)' },
    { value: 'recent', label: 'Agregado recientemente' },
    { value: 'sku', label: 'Código' },
]

const pageSizes = [24, 48, 96]

// TODO: leer de la configuración del negocio que entregue la API (RES-06)
const taxRate = 13

function Products() {
    const [search, setSearch] = useState('')
    const [view, setView] = useState('grid')
    const [sort, setSort] = useState('name-asc')
    const [pageSize, setPageSize] = useState(pageSizes[0])
    const [editingProduct, setEditingProduct] = useState(null)

    const term = search.trim().toLowerCase()
    const visibleProducts = products.filter(({ name, sku }) =>
        name.toLowerCase().includes(term) || sku.toLowerCase().includes(term)
    )

    // TODO: enviar los cambios a la API; el servidor recalcula el precio (RF-51)
    const handleSave = () => setEditingProduct(null)

    return (
        <main className='products'>

            <section className='products-header'>
                <h1>Productos</h1>
                <div className='products-actions'>
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
                <button type='button' className='products-button'>
                    Filtros ({activeFilters.length})
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
                    onChange={(event) => setSort(event.target.value)}
                >
                    {sortOptions.map(({ value, label }) => (
                        <option key={value} value={value}>Ordenar: {label}</option>
                    ))}
                </select>
            </section>

            {activeFilters.length > 0 && (
                <section className='products-active-filters'>
                    {activeFilters.map((filter) => (
                        <span key={filter} className='products-filter-tag'>
                            {filter}
                            <button type='button' aria-label={`Quitar filtro ${filter}`}>✕</button>
                        </span>
                    ))}
                    <button type='button' className='products-clear-filters'>Limpiar filtros</button>
                </section>
            )}

            <p className='products-count'>
                {visibleProducts.length} productos · mostrando 1–{Math.min(pageSize, visibleProducts.length)}
            </p>

            {visibleProducts.length === 0 ? (
                <section className='products-empty'>
                    <h2>No hay productos que coincidan</h2>
                    <p>Pruebe con otros filtros o con otro término de búsqueda.</p>
                    <button type='button' className='products-button' onClick={() => setSearch('')}>
                        Limpiar filtros
                    </button>
                </section>
            ) : view === 'grid' ? (
                // TODO: extraer la tarjeta administrativa a components/ (código, semáforo, etiquetas, "Ingresar mercancía")
                <section className='products-grid'>
                    {visibleProducts.map((product) => (
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

            <section className='products-pagination'>
                {/* TODO: paginación real a partir de pageSize */}
                <button type='button'>‹ Anterior</button>
                <button type='button' className='active'>1</button>
                <button type='button'>Siguiente ›</button>

                <select
                    className='products-page-size'
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
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
