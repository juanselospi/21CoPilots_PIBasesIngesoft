import './Home.css'
import ProductCard from '../../components/product-card/ProductCard.jsx'
import { categories } from '../../data/categories.js'
import { useCatalogo } from '../../hooks/useCatalogo.js'

// El público solo recibe estos dos estados: los no disponibles el
// servidor no los manda (RF-07, RF-08, RN-03).
const availabilityByDisponibilidad = {
    en_existencia: 'in-stock',
    por_contrapedido: 'backorder',
}

// Pasa el producto del catálogo a las props de ProductCard (arquitectura.md § 10.1).
const toCardProduct = ({ sku, nombre, categoria, precioFinal, imagenUrl, disponibilidad }) => ({
    sku,
    name: nombre,
    category: categoria,
    price: precioFinal,
    image: imagenUrl,
    availability: availabilityByDisponibilidad[disponibilidad],
})

const infoItems = [
    { title: 'Entregas en el GAM', description: 'Mensajero, Uber Flash, Correos de CR' },
    { title: 'Varias formas de pago', description: 'Por adelantado o contra entrega' },
    { title: 'Escríbenos', description: 'Consultas al correo del negocio' },
]

// Página de Inicio. Es el contenedor: pide los productos al servidor y
// se los pasa ya traducidos a ProductCard, que solo los muestra.
function Home() {
    // Productos del catálogo público; `recargar` vuelve a pedirlos
    const { datos, cargando, error, recargar } = useCatalogo()
    const products = datos?.map(toCardProduct) ?? []

    // TODO: el servidor todavía no manda la fecha de llegada; mientras se
    // decide de dónde sale, se muestran los primeros del catálogo.
    const latestProducts = products.slice(0, 5)

    // Hasta 4 productos por categoría; las que no tienen ninguno no se muestran
    const categorySections = categories
        .map((category) => ({
            category,
            products: products.filter((product) => product.category === category).slice(0, 4),
        }))
        .filter((section) => section.products.length > 0)

    return (
        <main className='home'>
            <section className='home-section home-banner'>
                <h1>DC Hobbies: Cultura Geek Online</h1>
                <p>Coleccionables, juguetes, videojuegos y TCG.</p>
                <a href='#' className='home-banner-button'>Ver catálogo</a>
            </section>

            <section className='home-section home-featured-categories'>
                {categories.map((category) => (
                    <a key={category} href='#' className='home-category-card'>
                        <span className='home-category-icon' />
                        {category}
                    </a>
                ))}
            </section>

            {/* Mientras llegan los productos, si falla la petición o si el catálogo
                está vacío se muestra un aviso en lugar de las secciones */}
            {cargando ? (
                <p className='home-section home-status' role='status'>Cargando productos…</p>
            ) : error ? (
                <div className='home-section home-status home-status-error' role='alert'>
                    <p>{error}</p>
                    <button type='button' className='home-status-button' onClick={recargar}>
                        Reintentar
                    </button>
                </div>
            ) : products.length === 0 ? (
                <p className='home-section home-status'>Todavía no hay productos en el catálogo.</p>
            ) : (
                <>
                    <section className='home-section'>
                        <div className='home-section-header'>
                            <h2 className='home-section-title'>Recién llegados</h2>
                        </div>
                        <div className='home-latest-products'>
                            {latestProducts.map((product) => (
                                <ProductCard key={product.sku} product={product} />
                            ))}
                        </div>
                    </section>

                    {categorySections.map(({ category, products: categoryProducts }) => (
                        <section key={category} className='home-section'>
                            <div className='home-section-header'>
                                <h2 className='home-section-title'>{category}</h2>
                                <a href='#'>Ver todo →</a>
                            </div>
                            <div className='home-category-products'>
                                {categoryProducts.map((product) => (
                                    <ProductCard key={product.sku} product={product} compact />
                                ))}
                            </div>
                        </section>
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

export default Home
