import { Link, useLocation, useParams } from 'react-router'
import './MyOrders.css'
import { OrderStatusChip, PaymentStatusChip } from '../orders/OrderChips.jsx'
import BackButton from '../../components/back-button/BackButton.jsx'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { obtenerMiPedido } from '../../api/pedidos.js'
import { useRecursoRemoto } from '../../hooks/useRecursoRemoto.js'
import { MY_ORDERS_PATH, backState, invoicePath } from '../../routes.js'
import { nombreDelMetodo } from '../../utils/checkout.js'
import { MODALIDADES } from '../../utils/pedidosAdmin.js'

const dateFormat = new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short' })
const PENDING = 'pendiente'

// Detalle de un pedido del cliente: entrega, lineas, pagos y el enlace a la factura.
// Es solo para ver, el cliente no puede cancelar, eso lo hace el administrador.
// Si el pedido no es suyo el servidor responde 404 y sale su mensaje
function MyOrderDetail() {
    const { numCarrito } = useParams()
    const pedido = useRecursoRemoto((signal) => obtenerMiPedido(numCarrito, { signal }), [numCarrito])

    return (
        <main className='my-orders'>
            <div>
                <BackButton fallback={MY_ORDERS_PATH} label='Volver a mis pedidos' />
            </div>

            {pedido.cargando && <p className='my-orders-card my-orders-status' role='status'>Cargando el pedido…</p>}

            {pedido.error && (
                <div className='my-orders-card my-orders-status my-orders-status-error' role='alert'>
                    <p>{pedido.error}</p>
                    <button type='button' className='my-orders-button' onClick={pedido.recargar}>Reintentar</button>
                </div>
            )}

            {pedido.datos && <OrderInfo pedido={pedido.datos} />}
        </main>
    )
}

function OrderInfo({ pedido }) {
    return (
        <article className='my-orders-card my-orders-detail'>
            <header className='my-orders-detail-header'>
                <div>
                    <h1 className='my-orders-title'>Pedido n.º {pedido.numCarrito}</h1>
                    <p>{dateFormat.format(new Date(pedido.fecha))}</p>
                </div>
                <OrderStatusChip estado={pedido.estado} />
            </header>

            <section>
                <h2>Entrega</h2>
                <p>{MODALIDADES[pedido.modalidadEntrega] ?? pedido.modalidadEntrega}</p>
                {pedido.direccion && <p>{pedido.direccion}</p>}
            </section>

            <section>
                <h2>Productos</h2>
                {/* En celular la tabla se desplaza sola y no estira la pagina */}
                <div className='my-orders-table-wrapper'>
                    <table className='my-orders-table'>
                        <thead>
                            <tr>
                                <th scope='col'>Producto</th>
                                <th scope='col'>Cantidad</th>
                                <th scope='col'>Precio sin impuesto</th>
                                <th scope='col'>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedido.lineas.map((linea) => (
                                <tr key={linea.sku}>
                                    <td>{linea.nombre}</td>
                                    <td>{linea.cantidad}</td>
                                    <td>{priceFormat.format(linea.precioUnitario)}</td>
                                    <td>{priceFormat.format(linea.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <dl className='my-orders-totals'>
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
                    <div className='my-orders-total'>
                        <dt>Total</dt>
                        <dd>{priceFormat.format(pedido.total)}</dd>
                    </div>
                </dl>
            </section>

            <section>
                <h2>Pagos</h2>
                {pedido.pagos.length === 0 ? <p>Este pedido no tiene pagos registrados.</p> : (
                    <ul className='my-orders-payments'>
                        {pedido.pagos.map((pago) => (
                            <li key={pago.numReferencia}>
                                <span>
                                    <strong>{nombreDelMetodo(pago.metodoPago)}</strong>
                                    <span>{dateFormat.format(new Date(pago.fecha))}</span>
                                </span>
                                <PaymentStatusChip estadoPago={pago.estadoPago} />
                                <span className='my-orders-row-total'>{priceFormat.format(pago.monto)}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {pedido.creditoOtorgado > 0 && (
                    <p className='my-orders-credit'>
                        Se te acreditó {priceFormat.format(pedido.creditoOtorgado)} a favor por este pedido.
                    </p>
                )}
            </section>

            <InvoiceLink pedido={pedido} />
        </article>
    )
}

// Contra entrega no tiene factura hasta que se pague, por eso a veces solo sale el aviso
function InvoiceLink({ pedido }) {
    const location = useLocation()

    if (pedido.factura) {
        return (
            <Link to={invoicePath(pedido.numCarrito)} state={backState(location)} className='my-orders-button my-orders-invoice'>
                Ver la factura
            </Link>
        )
    }

    const pendingPayment = pedido.pagos.some(({ estadoPago }) => estadoPago === PENDING)
    return (
        <p className='my-orders-note'>
            {pendingPayment ? 'La factura se emite cuando se pague el pedido.' : 'Este pedido no tiene factura.'}
        </p>
    )
}

export default MyOrderDetail
