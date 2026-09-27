import './Home.css'
import { categories } from '../../data/categories.js'

function Home() {
    return (
        <main className='home'>
            
            <section className='home-banner'>
                <h1>DC Hobbies Cultura Geek Online</h1>
                <p>Coleccionables, juguetes, videojuegos y TCG.</p>
                <a href='#'>Ver catálogo</a>
            </section>
            
            <section className='home-featured-categories'>
                {categories.map((category) => (
                    <a key={category} href='#' className='home-category-card'>
                        {category}
                    </a>
                ))}
            </section>
        </main>
    )
}

export default Home
