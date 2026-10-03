import { Link } from 'react-router'
import './ProductCard.css'
import { priceFormat, availabilityLabels } from './productFormat.js'

// La imagen y el nombre llevan a `to`, la tarjeta entera no es un enlace
// porque adentro tiene el boton de agregar al carrito cuya funcionalidad
// queda para otro sprint.
function ProductCard({ product, to, compact = false }) {
    const { name, price, image, availability } = product

    return (
        <article className={compact ? 'product-card product-card-compact' : 'product-card'}>
            <Link to={to} className='product-card-link' tabIndex={-1} aria-hidden='true'>
                {image ? (
                    <img className='product-card-image' src={image} alt={name} />
                ) : (
                    <div className='product-card-image product-card-no-image'>Sin imagen</div>
                )}
            </Link>

            <div className='product-card-body'>
                <h3 className='product-card-name'>
                    <Link to={to} className='product-card-link'>{name}</Link>
                </h3>

                <div className='product-card-details'>
                    <div>
                        <p className='product-card-price'>{priceFormat.format(price)}</p>
                        {!compact && <p className='product-card-tax'>impuesto incluido</p>}
                    </div>

                    <span className={`product-card-availability ${availability}`}>
                        {availabilityLabels[availability]}
                    </span>
                </div>

                {!compact && (
                    <button type='button' className='product-card-button'>
                        Agregar al carrito
                    </button>
                )}
            </div>
        </article>
    )
}

export default ProductCard
