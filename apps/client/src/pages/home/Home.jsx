import './Home.css'
import ProductCard from '../../components/product-card/ProductCard.jsx'
import { categories } from '../../data/categories.js'
import { products } from '../../data/products.js'

const latestProducts = [...products]
    .sort((a, b) => b.arrivedAt.localeCompare(a.arrivedAt))
    .slice(0, 5)

const infoItems = [
    { title: 'Entregas en el GAM', description: 'Mensajero, Uber Flash, Correos de CR' },
    { title: 'Varias formas de pago', description: 'Por adelantado o contra entrega' },
    { title: 'Escríbenos', description: 'Consultas al correo del negocio' },
]

function Home() {
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

            {categories.map((category) => (
                <section key={category} className='home-section'>
                    <div className='home-section-header'>
                        <h2 className='home-section-title'>{category}</h2>
                        <a href='#'>Ver todo →</a>
                    </div>
                    <div className='home-category-products'>
                        {products
                            .filter((product) => product.category === category)
                            .slice(0, 4)
                            .map((product) => (
                                <ProductCard key={product.sku} product={product} compact />
                            ))}
                    </div>
                </section>
            ))}

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
