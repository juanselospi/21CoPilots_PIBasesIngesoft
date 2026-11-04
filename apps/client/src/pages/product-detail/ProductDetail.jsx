import { useEffect, useId, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ImageOff, Minus, Plus } from 'lucide-react'
import './ProductDetail.css'
import AddToCartButton from '../../components/add-to-cart/AddToCartButton.jsx'
import AvailabilityChip from '../../components/product-card/AvailabilityChip.jsx'
import { toCardProduct } from '../../components/product-card/toCardProduct.js'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { useProducto } from '../../hooks/useProducto.js'
import { catalogPath } from '../../routes.js'
import { CANTIDAD_MAXIMA } from '../../utils/carrito.js'

// Ficha de un producto con imagen, nombre, descripcion, precio final, disponibilidad y el boton para agregarlo al carrito.
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

    const { sku: productSku, name, description, price, image, availability } = product

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

                    {/* Con la key la cantidad vuelve a 1 al pasar a otro producto */}
                    <BuyBox key={productSku} sku={productSku} />

                    {description && <p className='product-detail-description'>{description}</p>}
                </div>
            </article>
        </main>
    )
}

// Deja la cantidad entre 1 y el maximo que acepta el servidor, lo que no es numero cuenta como 1
const toQuantity = (texto) => Math.min(Math.max(Number.parseInt(texto, 10) || 1, 1), CANTIDAD_MAXIMA)

// Selector de cantidad y boton de agregar. Despues de agregar la cantidad vuelve a 1.
// El tope de existencias no se conoce aqui (el catalogo no las trae), lo avisa el servidor al agregar
function BuyBox({ sku }) {
    // Se guarda como texto para poder borrar el campo mientras se escribe
    const [quantity, setQuantity] = useState('1')
    const inputId = useId()
    const current = toQuantity(quantity)

    return (
        <div className='product-detail-buy'>
            <div className='product-detail-quantity'>
                <label htmlFor={inputId}>Cantidad</label>
                <div className='product-detail-stepper'>
                    <button
                        type='button'
                        aria-label='Quitar una unidad'
                        onClick={() => setQuantity(String(current - 1))}
                        disabled={current <= 1}
                    >
                        <Minus size={18} aria-hidden='true' />
                    </button>
                    <input
                        id={inputId}
                        type='text'
                        inputMode='numeric'
                        value={quantity}
                        // Solo deja escribir digitos
                        onChange={(event) => setQuantity(event.target.value.replace(/\D/g, '').slice(0, 3))}
                        onBlur={() => setQuantity(String(current))}
                    />
                    <button
                        type='button'
                        aria-label='Agregar una unidad'
                        onClick={() => setQuantity(String(current + 1))}
                        disabled={current >= CANTIDAD_MAXIMA}
                    >
                        <Plus size={18} aria-hidden='true' />
                    </button>
                </div>
            </div>

            <AddToCartButton
                sku={sku}
                quantity={current}
                className='product-detail-add'
                onAdded={() => setQuantity('1')}
            />
        </div>
    )
}

export default ProductDetail
