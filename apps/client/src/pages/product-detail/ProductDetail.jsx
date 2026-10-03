import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { ImageOff } from 'lucide-react'
import './ProductDetail.css'
import AvailabilityChip from '../../components/product-card/AvailabilityChip.jsx'
import { toCardProduct } from '../../components/product-card/toCardProduct.js'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { useProducto } from '../../hooks/useProducto.js'
import { catalogPath } from '../../routes.js'

// Ficha de un producto con imagen, nombre, descripcion, precio final y disponibilidad.
// Un producto oculto se muestra como no encontrado.
function ProductDetail() {
    const { sku } = useParams()
    const producto = useProducto(sku)
    const product = producto.datos && toCardProduct(producto.datos)

    // Si se llega desde una tarjeta de abajo la vista empieza arriba
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [sku])

    if (producto.cargando) {
        return (
            <main className='product-detail'>
                <p className='product-detail-section product-detail-status' role='status'>Cargando producto…</p>
            </main>
        )
    }

    if (producto.error) {
        return (
            <main className='product-detail'>
                <div className='product-detail-section product-detail-status product-detail-status-error' role='alert'>
                    <p>{producto.error}</p>
                    <button type='button' className='product-detail-status-button' onClick={producto.recargar}>
                        Reintentar
                    </button>
                </div>
            </main>
        )
    }

    if (!product) {
        return (
            <main className='product-detail'>
                <div className='product-detail-section product-detail-status'>
                    <p>No encontramos este producto.</p>
                    <Link to={catalogPath()}>Ver todo el catálogo</Link>
                </div>
            </main>
        )
    }

    const { name, description, price, image, availability } = product

    return (
        <main className='product-detail'>
            <article className='product-detail-section product-detail-content'>
                {image ? (
                    <img className='product-detail-image' src={image} alt={name} />
                ) : (
                    <div className='product-detail-image product-detail-no-image'><ImageOff size={40} />Sin imagen</div>
                )}

                <div className='product-detail-info'>
                    <h1 className='product-detail-name'>{name}</h1>

                    <div>
                        <p className='product-detail-price'>{priceFormat.format(price)}</p>
                        <p className='product-detail-tax'>impuesto incluido</p>
                    </div>

                    <AvailabilityChip availability={availability} />

                    {description && <p className='product-detail-description'>{description}</p>}
                </div>
            </article>
        </main>
    )
}

export default ProductDetail
