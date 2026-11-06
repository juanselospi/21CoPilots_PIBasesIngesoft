import { useId } from 'react'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { useCarrito } from '../../hooks/useCarrito.js'
import { totalConEnvio } from '../../utils/checkout.js'

// Totales que se ven al lado de todos los pasos. El envio entra cuando se escoge la modalidad
function CheckoutSummary({ selectedDelivery }) {
    const { carrito } = useCarrito()
    const titleId = useId()

    return (
        <aside className='checkout-summary' aria-labelledby={titleId}>
            <h2 id={titleId}>Tu pedido</h2>
            <dl className='checkout-totals'>
                <div>
                    <dt>Subtotal</dt>
                    <dd>{priceFormat.format(carrito.subtotal)}</dd>
                </div>
                <div>
                    <dt>Impuesto</dt>
                    <dd>{priceFormat.format(carrito.impuesto)}</dd>
                </div>
                <div>
                    <dt>Envío</dt>
                    <dd>{selectedDelivery ? priceFormat.format(selectedDelivery.costo) : 'Escoge la entrega'}</dd>
                </div>
                <div className='checkout-total'>
                    <dt>Total</dt>
                    <dd>{priceFormat.format(totalConEnvio(carrito, selectedDelivery))}</dd>
                </div>
            </dl>
        </aside>
    )
}

export default CheckoutSummary
