import './ProductCard.css'

const priceFormat = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
})

const availabilityLabels = {
    'in-stock': 'En existencia',
    'backorder': 'Por contrapedido',
}

function ProductCard({ product, compact = false }) {
    const { name, price, image, availability } = product

    return (
        <article className={compact ? 'product-card product-card-compact' : 'product-card'}>
            {image ? (
                <img className='product-card-image' src={image} alt={name} />
            ) : (
                <div className='product-card-image product-card-no-image'>Sin imagen</div>
            )}

            <div className='product-card-body'>
                <h3 className='product-card-name'>{name}</h3>

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
