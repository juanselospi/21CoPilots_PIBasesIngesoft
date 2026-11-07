import { useId } from 'react'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { useCarrito } from '../../hooks/useCarrito.js'
import { restantePorPagar, totalConEnvio } from '../../utils/checkout.js'

// Totales que se ven al lado de todos los pasos. El envio entra cuando se escoge la modalidad
// y el credito a favor cuando se marca en el pago
function CheckoutSummary({ selectedDelivery, creditUsed = 0 }) {
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
                {creditUsed > 0 && (
                    <div>
                        <dt>Crédito a favor</dt>
                        <dd>−{priceFormat.format(creditUsed)}</dd>
                    </div>
                )}
                <div className='checkout-total'>
                    <dt>{creditUsed > 0 ? 'Por pagar' : 'Total'}</dt>
                    <dd>{priceFormat.format(restantePorPagar(totalConEnvio(carrito, selectedDelivery), creditUsed))}</dd>
                </div>
            </dl>
        </aside>
    )
}

export default CheckoutSummary
