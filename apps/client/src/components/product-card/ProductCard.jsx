import { Link, useLocation } from 'react-router'
import './ProductCard.css'
import AvailabilityChip from './AvailabilityChip.jsx'
import ProductImage from '../product-image/ProductImage.jsx'
import AddToCartButton from '../add-to-cart/AddToCartButton.jsx'
import { priceFormat } from './productFormat.js'
import { backState } from '../../routes.js'

// La imagen y el nombre llevan a `to`, la tarjeta entera no es un enlace
// porque adentro tiene el boton de agregar al carrito, que agrega de a 1.
function ProductCard({ product, to, compact = false }) {
    const { sku, name, price, image, availability } = product
    // La ficha del producto vuelve a esta página (inicio o catálogo) con su flecha
    const state = backState(useLocation())

    return (
        <article className={compact ? 'product-card product-card-compact' : 'product-card'}>
            <Link to={to} state={state} className='product-card-link' tabIndex={-1} aria-hidden='true'>
                <ProductImage src={image} alt={name} className='product-card-image' emptyClassName='product-card-no-image' />
            </Link>

            <div className='product-card-body'>
                <h3 className='product-card-name'>
                    <Link to={to} state={state} className='product-card-link'>{name}</Link>
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
