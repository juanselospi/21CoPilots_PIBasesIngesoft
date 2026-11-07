import { Link, Navigate, useLocation } from 'react-router'
import { CircleCheck } from 'lucide-react'
import './Checkout.css'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { useCarrito } from '../../hooks/useCarrito.js'
import { useRecursoRemoto } from '../../hooks/useRecursoRemoto.js'
import { backState, catalogPath, invoicePath } from '../../routes.js'
import { nombreDelMetodo } from '../../utils/checkout.js'

const CASH_ON_DELIVERY = 'contra_entrega'
const APPROVED = 'aprobado'

const orderStates = { colocado: 'Colocado' }
const paymentStates = {
    aprobado: { label: 'Aprobado', className: 'chip chip-ok' },
    pendiente: { label: 'Pendiente de cobro', className: 'chip chip-aviso' },
}

// Pantalla despues de comprar. El pedido llega en el estado de la navegacion porque el servidor
// todavia no tiene como consultar un pedido, por eso sobrevive a recargar pero sin el no hay nada que mostrar
function OrderConfirmation() {
    const location = useLocation()
    const { pedido, deliveryName } = location.state ?? {}
    const { actualizar } = useCarrito()
    // El carrito ya se convirtio en pedido, asi el contador del header baja a 0
    useRecursoRemoto((signal) => actualizar(signal), [])

    if (!pedido) return <Navigate to='/' replace />

    const paymentState = paymentStates[pedido.pago.resultado] ?? { label: pedido.pago.resultado, className: 'chip' }

    return (
        <main className='checkout'>
            <div className='checkout-section checkout-confirmation'>
                <div className='checkout-confirmation-heading'>
                    <CircleCheck size={48} aria-hidden='true' />
                    <h1>¡Gracias por tu compra!</h1>
                    <p className='checkout-confirmation-number'>Pedido n.º {pedido.numCarrito}</p>
                </div>

                <dl className='checkout-totals'>
                    <div>
                        <dt>Estado del pedido</dt>
                        <dd><span className='chip chip-info'>{orderStates[pedido.estado] ?? pedido.estado}</span></dd>
                    </div>
                    <div>
                        <dt>Pago</dt>
                        <dd><span className={paymentState.className}>{paymentState.label}</span></dd>
                    </div>
                    <div>
                        <dt>Medio de pago</dt>
                        <dd>{nombreDelMetodo(pedido.metodoPago)}</dd>
                    </div>
                    <div>
                        <dt>Entrega</dt>
                        <dd>{deliveryName ?? pedido.modalidadEntrega}</dd>
                    </div>
                    {pedido.direccion && (
                        <div>
                            <dt>Dirección</dt>
                            <dd>{pedido.direccion}</dd>
                        </div>
                    )}
                </dl>

                <ul className='checkout-review-lines' aria-label='Productos del pedido'>
                    {pedido.lineas.map((linea) => (
                        <li key={linea.sku}>
                            <span className='checkout-review-name'>{linea.cantidad} × {linea.nombre}</span>
                            <span className='checkout-review-price'>{priceFormat.format(linea.precioFinal * linea.cantidad)}</span>
                        </li>
                    ))}
                </ul>

                <dl className='checkout-totals'>
                    <div>
                        <dt>Subtotal</dt>
                        <dd>{priceFormat.format(pedido.subtotal)}</dd>
                    </div>
                    <div>
                        <dt>Impuesto</dt>
                        <dd>{priceFormat.format(pedido.impuesto)}</dd>
                    </div>
                    <div>
                        <dt>Envío</dt>
                        <dd>{priceFormat.format(pedido.costoEntrega)}</dd>
                    </div>
                    <div className='checkout-total'>
                        <dt>Total</dt>
                        <dd>{priceFormat.format(pedido.total)}</dd>
                    </div>
                    {pedido.creditoUsado > 0 && (
                        <div>
                            <dt>Pagado con tu crédito a favor</dt>
                            <dd>{priceFormat.format(pedido.creditoUsado)}</dd>
                        </div>
                    )}
                </dl>

                <InvoiceNote pedido={pedido} state={backState(location)} />

                <Link to={catalogPath()} className='checkout-keep-shopping'>Seguir comprando</Link>
            </div>
        </main>
    )
}

// Contra entrega no tiene factura hasta que se pague. Si se pago y aun asi no vino, la facturacion no estaba disponible
function InvoiceNote({ pedido, state }) {
    if (pedido.factura) {
        return <Link to={invoicePath(pedido.numCarrito)} state={state} className='checkout-primary'>Ver la factura</Link>
    }

    if (pedido.metodoPago === CASH_ON_DELIVERY) {
        return <p className='checkout-hint'>La factura se emite cuando se pague el pedido.</p>
    }

    return pedido.pago.resultado === APPROVED
        ? <p className='checkout-emulated'>Tu pago se aprobó, pero la factura no se pudo emitir todavía.</p>
        : null
}

export default OrderConfirmation
