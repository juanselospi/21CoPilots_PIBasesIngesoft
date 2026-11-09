import { useState } from 'react'
import { Plus } from 'lucide-react'
import QuantityStepper from '../../components/quantity-stepper/QuantityStepper.jsx'
import ProductImage from '../../components/product-image/ProductImage.jsx'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { aCantidad } from '../../utils/carrito.js'

function stockChip({ disponibilidad, existencias, etiquetas }) {
    if (disponibilidad === 'no_disponible') return { className: 'chip chip-error', text: 'Agotado' }
    if (existencias === 0) return { className: 'chip chip-aviso', text: 'Por contrapedido' }
    return { className: `chip ${etiquetas.includes('existencias_bajas') ? 'chip-aviso' : 'chip-ok'}`, text: `${existencias} ${existencias === 1 ? 'ud' : 'uds'}` }
}

// Tarjeta de un producto: elige la cantidad y la agrega a la venta en curso.
// `onAdd` devuelve el problema si no se pudo agregar, o null.
function SaleProductCard({ product, inSale, onAdd }) {
    const [quantity, setQuantity] = useState('1')
    const [problem, setProblem] = useState(null)
    const soldOut = product.disponibilidad === 'no_disponible'
    const chip = stockChip(product)

    const changeQuantity = (value) => {
        setQuantity(value)
        setProblem(null)
    }

    const add = () => {
        const found = onAdd(product, aCantidad(quantity))
        setProblem(found)
        if (!found) setQuantity('1')
    }

    return (
        <article className='products-card'>
            <ProductImage src={product.imagenUrl} className='products-card-image' iconSize={24} />
            <div className='products-card-body'>
                <span className='products-card-sku codigo'>{product.sku}</span>
                <h2 className='products-card-name'>{product.nombre}</h2>
                <p className='products-card-price'>{priceFormat.format(product.precioFinal)}</p>
                <div className='sales-card-stock'>
                    <span className={chip.className}>{chip.text}</span>
                    {inSale > 0 && <span className='orders-secondary'>{inSale} en la venta</span>}
                </div>
                <QuantityStepper
                    value={quantity}
                    onType={changeQuantity}
                    onStep={(next) => changeQuantity(String(next))}
                    onDone={() => setQuantity(String(aCantidad(quantity)))}
                    disabled={soldOut}
                    inputAttributes={{ 'aria-label': `Cantidad de ${product.nombre}` }}
                />
                <button type='button' className='products-button' disabled={soldOut} onClick={add} aria-label={`Agregar ${product.nombre} a la venta`}>
                    <Plus size={16} aria-hidden='true' />Agregar
                </button>
                {problem && <p className='product-form-error' role='alert'>{problem}</p>}
            </div>
        </article>
    )
}

export default SaleProductCard
