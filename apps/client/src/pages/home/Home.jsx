import { Link, useOutletContext } from 'react-router'
import { ChevronRight, CreditCard, Gamepad2, Gem, Layers, Mail, Tag, ToyBrick, Truck } from 'lucide-react'
import './Home.css'
import ProductCard from '../../components/product-card/ProductCard.jsx'
import { toCardProduct } from '../../components/product-card/toCardProduct.js'
import { useCatalogo } from '../../hooks/useCatalogo.js'
import { catalogPath, productPath } from '../../routes.js'

const infoItems = [
    { title: 'Entregas en el GAM', description: 'Mensajero, Uber Flash, Correos de CR', Icon: Truck },
    { title: 'Varias formas de pago', description: 'Por adelantado o contra entrega', Icon: CreditCard },
    { title: 'Escríbenos', description: 'Consultas al correo del negocio', Icon: Mail },
]

// Las categorias vienen del servidor, asi que el icono se busca por una parte del nombre
const categoryIcons = [
    { match: 'coleccionable', Icon: Gem },
    { match: 'juguete', Icon: ToyBrick },
    { match: 'lego', Icon: ToyBrick },
    { match: 'videojuego', Icon: Gamepad2 },
    { match: 'tcg', Icon: Layers },
    { match: 'trading', Icon: Layers },
]

const categoryIcon = (category) =>
    categoryIcons.find(({ match }) => category.toLowerCase().includes(match))?.Icon ?? Tag

// Página de Inicio: pide los productos y se los pasa traducidos a ProductCard.
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

            {/* Aviso en lugar de las secciones mientras carga, si falla o si el catálogo está vacío */}
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
                        {categoryNames.map((category) => {
                            const Icon = categoryIcon(category)
                            return (
                                <Link key={category} to={catalogPath(category)} className='home-category-card'>
                                    <span className='home-category-icon'><Icon size={24} /></span>
                                    {category}
                                </Link>
                            )
                        })}
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
                    {infoItems.map(({ title, description, Icon }) => (
                        <div key={title} className='home-info-item'>
                            <span className='home-info-icon'><Icon size={20} /></span>
                            <div>
                                <h3>{title}</h3>
                                <p>{description}</p>
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

    // Si carga, falla o está vacía no se muestra; el error ya lo avisa la página.
    if (!datos?.length) return null

    return (
        <section className='home-section'>
            <div className='home-section-header'>
                <h2 className='home-section-title'>{category}</h2>
                <Link to={catalogPath(category)}>Ver todo<ChevronRight size={16} /></Link>
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
