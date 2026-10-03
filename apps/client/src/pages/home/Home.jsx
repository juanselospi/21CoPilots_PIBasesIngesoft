import { Link, useOutletContext } from 'react-router'
import './Home.css'
import ProductCard from '../../components/product-card/ProductCard.jsx'
import { toCardProduct } from '../../components/product-card/toCardProduct.js'
import { useCatalogo } from '../../hooks/useCatalogo.js'
import { catalogPath, productPath } from '../../routes.js'

const infoItems = [
    { title: 'Entregas en el GAM', description: 'Mensajero, Uber Flash, Correos de CR' },
    { title: 'Varias formas de pago', description: 'Por adelantado o contra entrega' },
    { title: 'Escríbenos', description: 'Consultas al correo del negocio' },
]

// Página de Inicio. Es el contenedor: pide los productos al servidor y
// se los pasa ya traducidos a ProductCard, que solo los muestra.
function Home() {
    // Las categorías las pide StoreLayout una sola vez y las comparte
    const { categorias, categoryNames } = useOutletContext()

    // TODO: el servidor todavía no manda la fecha de llegada; mientras se
    // decide de dónde sale, se muestran los primeros del catálogo.
    const latest = useCatalogo({ limite: 5 })
    const latestProducts = latest.datos?.map(toCardProduct) ?? []

    // Si falla cualquiera de las dos peticiones, "Reintentar" repite ambas
    const cargando = latest.cargando || categorias.cargando
    const error = latest.error ?? categorias.error
    const retry = () => {
        latest.recargar()
        categorias.recargar()
    }

    return (
        <main className='home'>
            <section className='home-section home-banner'>
                <h1>DC Hobbies: Cultura Geek Online</h1>
                <p>Video Juegos, Legos y Trading Cards.</p>
                <Link to={catalogPath()} className='home-banner-button'>Ver catálogo</Link>
            </section>

            {/* Mientras llegan los datos, si falla la petición o si el catálogo
                está vacío se muestra un aviso en lugar de las secciones */}
            {cargando ? (
                <p className='home-section home-status' role='status'>Cargando productos…</p>
            ) : error ? (
                <div className='home-section home-status home-status-error' role='alert'>
                    <p>{error}</p>
                    <button type='button' className='home-status-button' onClick={retry}>
                        Reintentar
                    </button>
                </div>
            ) : latestProducts.length === 0 ? (
                <p className='home-section home-status'>Todavía no hay productos en el catálogo.</p>
            ) : (
                <>
                    <section className='home-section home-featured-categories'>
                        {categoryNames.map((category) => (
                            <Link key={category} to={catalogPath(category)} className='home-category-card'>
                                <span className='home-category-icon' />
                                {category}
                            </Link>
                        ))}
                    </section>

                    <section className='home-section'>
                        <div className='home-section-header'>
                            <h2 className='home-section-title'>Recién llegados</h2>
                        </div>
                        <div className='home-latest-products'>
                            {latestProducts.map((product) => (
                                <ProductCard key={product.sku} product={product} to={productPath(product.sku)} />
                            ))}
                        </div>
                    </section>

                    {categoryNames.map((category) => (
                        <CategorySection key={category} category={category} />
                    ))}
                </>
            )}

            <section className='home-info'>
                <div className='home-section home-info-items'>
                    {infoItems.map((item) => (
                        <div key={item.title} className='home-info-item'>
                            <span className='home-info-icon' />
                            <div>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    )
}

// Sección de una categoría con sus primeros 4 productos. Cada una pide los
// suyos, así no depende de que entren en una sola página del catálogo.
function CategorySection({ category }) {
    const { datos } = useCatalogo({ categoria: category, limite: 4 })

    // Mientras carga, si falla o si no tiene productos visibles no se muestra;
    // la falta de conexión ya la avisa el estado general de la página.
    if (!datos?.length) return null

    return (
        <section className='home-section'>
            <div className='home-section-header'>
                <h2 className='home-section-title'>{category}</h2>
                <Link to={catalogPath(category)}>Ver todo →</Link>
            </div>
            <div className='home-category-products'>
                {datos.map(toCardProduct).map((product) => (
                    <ProductCard key={product.sku} product={product} to={productPath(product.sku)} compact />
                ))}
            </div>
        </section>
    )
}

export default Home
