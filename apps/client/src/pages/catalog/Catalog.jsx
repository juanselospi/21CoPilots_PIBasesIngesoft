import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useOutletContext, useParams, useSearchParams } from 'react-router'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
// La barra, las etiquetas de filtros y la paginación son las del panel de Productos
import '../products/Products.css'
import './Catalog.css'
import ProductCard from '../../components/product-card/ProductCard.jsx'
import { toCardProduct } from '../../components/product-card/toCardProduct.js'
import { priceFormat } from '../../components/product-card/productFormat.js'
import ProductFilters from '../../components/product-filters/ProductFilters.jsx'
import { activeFilterTags, emptyFilters } from '../../components/product-filters/productFilters.js'
import Pagination from '../../components/pagination/Pagination.jsx'
import Select from '../../components/select/Select.jsx'
import BackButton from '../../components/back-button/BackButton.jsx'
import { usePaginaDelCatalogo } from '../../hooks/usePaginaDelCatalogo.js'
import { useRestaurarScroll } from '../../hooks/useRestaurarScroll.js'
import { catalogPath, productPath } from '../../routes.js'
import {
    PRODUCTOS_POR_PAGINA,
    disponibilidadesDelCatalogo,
    leerConsultaDelCatalogo,
    ordenesDelCatalogo,
    parametrosDelCatalogo,
    textoDeResultados,
} from '../../utils/consultaDelCatalogo.js'

// Claves de la consulta que son filtros (las que limpia «Limpiar filtros»)
const FILTER_KEYS = ['categoria', 'disponibilidad', 'precioMin', 'precioMax']

// Catálogo de la tienda: todo el catálogo, una categoría (/catalogo/:category) o los resultados
// de la búsqueda del encabezado (?q=). Búsqueda, filtros, orden y página viven en la URL, así
// recargar, compartir el enlace o volver desde un producto deja todo igual. El servidor filtra,
// ordena y devuelve solo la página pedida.
function Catalog() {
    const { category } = useParams()
    const { categorias, categoryNames } = useOutletContext()
    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()
    const [showFilters, setShowFilters] = useState(false)
    const toolbarRef = useRef(null)

    // Dentro de una categoría, la categoría es el contexto y no un filtro más
    const query = leerConsultaDelCatalogo(searchParams, { conCategoria: !category })
    const catalogo = usePaginaDelCatalogo({
        categoria: category ?? (query.categoria || undefined),
        q: query.q || undefined,
        disponibilidad: query.disponibilidad || undefined,
        precioMin: query.precioMin,
        precioMax: query.precioMax,
        orden: query.orden,
        limite: PRODUCTOS_POR_PAGINA,
        pagina: query.pagina,
    })
    // Mientras llega otra página se siguen viendo los productos anteriores, atenuados:
    // así la página no se encoge ni salta al cambiar de página o de orden
    const [lastLoaded, setLastLoaded] = useState(null)
    if (catalogo.datos && catalogo.datos !== lastLoaded) setLastLoaded(catalogo.datos)
    const shown = catalogo.datos ?? (catalogo.cargando ? lastLoaded : null)
    const refreshing = catalogo.cargando && Boolean(shown)

    const products = shown?.datos.map(toCardProduct) ?? []
    const total = shown?.meta.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / PRODUCTOS_POR_PAGINA))
    // La paginación muestra la página pedida aunque todavía se vean los productos de la anterior

    // Mismo objeto mientras no cambie la URL: el panel reinicia su borrador cuando cambian los filtros
    const filtersKey = JSON.stringify([category ?? '', query.categoria, query.disponibilidad, query.precioMin, query.precioMax])
    const [applied, setApplied] = useState({ key: null, filters: null })
    if (applied.key !== filtersKey) {
        const { categoria, disponibilidad, precioMin, precioMax } = query
        setApplied({ key: filtersKey, filters: { ...emptyFilters, categoria, disponibilidad, precioMin, precioMax } })
    }
    const filters = applied.filters ?? emptyFilters
    const filterTags = activeFilterTags(filters, priceFormat.format, disponibilidadesDelCatalogo)

    // Cada cambio deja una entrada en el historial (atrás vuelve a la página anterior de resultados)
    // y marca que, al cargar, la vista baje solo hasta los resultados y no al principio
    const go = (next, { replace = false } = {}) =>
        setSearchParams(parametrosDelCatalogo({ ...query, ...next }), { replace, state: { scroll: 'resultados' } })

    const applyFilters = (next) => {
        go({ ...Object.fromEntries(FILTER_KEYS.map((key) => [key, next[key]])), pagina: 0 })
        setShowFilters(false)
    }
    const removeFilter = (key) => go({ [key]: '', pagina: 0 })
    const clearFilters = () => go({ ...Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])), pagina: 0 })

    // Una página que ya no existe (filtros nuevos, enlace viejo) pasa a la última que sí
    const lastPage = pageCount - 1
    useEffect(() => {
        if (!catalogo.cargando && !catalogo.error && query.pagina > lastPage) {
            setSearchParams(parametrosDelCatalogo({ ...query, pagina: lastPage }), { replace: true })
        }
    })

    // Al volver de un producto queda donde estaba; al cambiar de página baja hasta los resultados
    // solo si quedaron arriba de la vista; al llegar por un enlace empieza arriba
    useRestaurarScroll(!catalogo.cargando, {
        alLlegar: () => {
            if (location.state?.scroll !== 'resultados') {
                window.scrollTo(0, 0)
                return
            }
            const toolbar = toolbarRef.current
            if (toolbar && toolbar.getBoundingClientRect().top < 0) {
                const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
                toolbar.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
            }
        },
    })

    // StoreLayout solo trae las categorías que tienen productos visibles
    const unknownCategory = Boolean(category) && Boolean(categorias.datos) && !categoryNames.includes(category)
    const title = query.q ? `Resultados para «${query.q}»` : (category ?? 'Todo el catálogo')

    return (
        <main className='catalog'>
            <div className='catalog-section catalog-heading'>
                <BackButton fallback='/' label='Volver a la tienda' />
            </div>
            <h1 className='catalog-section catalog-title'>{title}</h1>

            {unknownCategory ? (
                <div className='catalog-section catalog-status'>
                    <p>No encontramos la categoría «{category}».</p>
                    <Link to={catalogPath()}>Ver todo el catálogo</Link>
                </div>
            ) : (
                <>
                    <section ref={toolbarRef} className='catalog-section catalog-toolbar' aria-label='Filtros y orden'>
                        <button
                            type='button'
                            className='products-button'
                            aria-expanded={showFilters}
                            aria-controls='catalog-filters'
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal size={20} aria-hidden='true' />
                            Filtros{filterTags.length > 0 && ` (${filterTags.length})`}
                            <ChevronDown size={16} className='products-button-chevron' aria-hidden='true' />
                        </button>

                        <Select
                            className='products-sort catalog-sort'
                            aria-label='Ordenar productos'
                            value={query.orden}
                            onChange={(orden) => go({ orden, pagina: 0 })}
                            options={ordenesDelCatalogo.map(({ value, label }) => ({ value, label: `Ordenar: ${label}` }))}
                        />
                    </section>

                    <div className='catalog-section catalog-filters'>
                        <ProductFilters
                            id='catalog-filters'
                            open={showFilters}
                            filters={filters}
                            categories={category ? null : categoryNames}
                            availabilityOptions={disponibilidadesDelCatalogo}
                            showFlags={false}
                            onApply={applyFilters}
                            onClose={() => setShowFilters(false)}
                        />
                    </div>

                    {filterTags.length > 0 && (
                        <section className='catalog-section products-active-filters' aria-label='Filtros aplicados'>
                            {filterTags.map(({ key, label }) => (
                                <span key={key} className='products-filter-tag'>
                                    {label}
                                    <button type='button' aria-label={`Quitar filtro ${label}`} onClick={() => removeFilter(key)}>
                                        <X size={16} aria-hidden='true' />
                                    </button>
                                </span>
                            ))}
                            <button type='button' className='products-clear-filters' onClick={clearFilters}>
                                Limpiar filtros
                            </button>
                        </section>
                    )}

                    {catalogo.cargando && !shown ? (
                        <p className='catalog-section catalog-status' role='status'>Cargando productos…</p>
                    ) : catalogo.error ? (
                        <div className='catalog-section catalog-status catalog-status-error' role='alert'>
                            <p>{catalogo.error}</p>
                            <button type='button' className='catalog-status-button' onClick={catalogo.recargar}>
                                Reintentar
                            </button>
                        </div>
                    ) : products.length === 0 ? (
                        <EmptyResults
                            hasFilters={filterTags.length > 0}
                            search={query.q}
                            category={category}
                            onClearFilters={clearFilters}
                        />
                    ) : (
                        <>
                            <section
                                className={`catalog-section catalog-products${refreshing ? ' catalog-products-refreshing' : ''}`}
                                aria-label='Productos'
                                aria-busy={refreshing}
                            >
                                {products.map((product) => (
                                    <ProductCard key={product.sku} product={product} to={productPath(product.sku)} />
                                ))}
                            </section>

                            <Pagination
                                className='catalog-section catalog-pagination'
                                label='Páginas del catálogo'
                                page={query.pagina}
                                pageCount={pageCount}
                                onChange={(pagina) => go({ pagina })}
                                summary={textoDeResultados(query.pagina, total)}
                            />
                        </>
                    )}
                </>
            )}
        </main>
    )
}

// Sin resultados: con filtros se ofrece limpiarlos; si no, se explica por qué está vacío
function EmptyResults({ hasFilters, search, category, onClearFilters }) {
    if (hasFilters) {
        return (
            <div className='catalog-section catalog-status'>
                <p>No encontramos productos con estos filtros.</p>
                <button type='button' className='catalog-status-button' onClick={onClearFilters}>Limpiar filtros</button>
            </div>
        )
    }
    if (search) {
        return (
            <div className='catalog-section catalog-status'>
                <p>No encontramos productos para «{search}».</p>
                <Link to={catalogPath()}>Ver todo el catálogo</Link>
            </div>
        )
    }
    return (
        <p className='catalog-section catalog-status'>
            {category ? 'Esta categoría no tiene productos disponibles.' : 'Todavía no hay productos en el catálogo.'}
        </p>
    )
}

export default Catalog
