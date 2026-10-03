import { useEffect } from 'react'
import { Link, useOutletContext, useParams } from 'react-router'
import './Catalog.css'
import ProductCard from '../../components/product-card/ProductCard.jsx'
import { toCardProduct } from '../../components/product-card/toCardProduct.js'
import { useCatalogo } from '../../hooks/useCatalogo.js'
import { catalogPath } from '../../routes.js'

// Es el maximo que acepta el servidor -> la paginacion queda pendiente en otro sprint
const PRODUCT_LIMIT = 48

// Pagina de "ver todo" con los productos visibles de una categoria, o de todo
// el catalogo si la ruta no trae categoria.
function Catalog() {
    const { category } = useParams()
    const { categorias, categoryNames } = useOutletContext()

    const catalogo = useCatalogo({ categoria: category, limite: PRODUCT_LIMIT })
    const products = catalogo.datos?.map(toCardProduct) ?? []

    // Si se llega desde el pie de pagina la vista empieza arriba
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [category])

    // StoreLayout solo trae las categorias que tienen productos visibles
    const unknownCategory = Boolean(category) && Boolean(categorias.datos) && !categoryNames.includes(category)

    return (
        <main className='catalog'>
            <h1 className='catalog-section catalog-title'>{category ?? 'Todo el catálogo'}</h1>

            {catalogo.cargando ? (
                <p className='catalog-section catalog-status' role='status'>Cargando productos…</p>
            ) : catalogo.error ? (
                <div className='catalog-section catalog-status catalog-status-error' role='alert'>
                    <p>{catalogo.error}</p>
                    <button type='button' className='catalog-status-button' onClick={catalogo.recargar}>
                        Reintentar
                    </button>
                </div>
            ) : unknownCategory ? (
                <div className='catalog-section catalog-status'>
                    <p>No encontramos la categoría «{category}».</p>
                    <Link to={catalogPath()}>Ver todo el catálogo</Link>
                </div>
            ) : products.length === 0 ? (
                <p className='catalog-section catalog-status'>
                    {category ? 'Esta categoría no tiene productos disponibles.' : 'Todavía no hay productos en el catálogo.'}
                </p>
            ) : (
                <section className='catalog-section catalog-products'>
                    {products.map((product) => (
                        <ProductCard key={product.sku} product={product} />
                    ))}
                </section>
            )}
        </main>
    )
}

export default Catalog
