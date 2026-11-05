import { Link } from 'react-router'
import { ImageOff } from 'lucide-react'
import './ProductCard.css'
import AvailabilityChip from './AvailabilityChip.jsx'
import AddToCartButton from '../add-to-cart/AddToCartButton.jsx'
import { priceFormat } from './productFormat.js'

// La imagen y el nombre llevan a `to`, la tarjeta entera no es un enlace
// porque adentro tiene el boton de agregar al carrito, que agrega de a 1.
function ProductCard({ product, to, compact = false }) {
    const { sku, name, price, image, availability } = product

    return (
        <article className={compact ? 'product-card product-card-compact' : 'product-card'}>
            <Link to={to} className='product-card-link' tabIndex={-1} aria-hidden='true'>
                {image ? (
                    <img className='product-card-image' src={image} alt={name} />
                ) : (
                    <div className='product-card-image product-card-no-image'><ImageOff size={28} />Sin imagen</div>
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

                    <AvailabilityChip availability={availability} />
                </div>

                {!compact && <AddToCartButton sku={sku} className='product-card-button' />}
            </div>
        </article>
    )
}

export default ProductCard
