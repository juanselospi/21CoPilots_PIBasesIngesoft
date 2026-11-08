import { useState } from 'react'
import { useParams } from 'react-router'
// Mismo aspecto que la página de productos y su tabla
import '../products/Products.css'
import '../../components/product-table/ProductTable.css'
import './Orders.css'
import BackButton from '../../components/back-button/BackButton.jsx'
import ConfirmDialog from '../../components/confirm-dialog/ConfirmDialog.jsx'
import Notice from '../../components/notice/Notice.jsx'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { dateTimeFormat } from '../merchandise/merchandiseFormat.js'
import { cambiarEstadoPedido, obtenerPedidoAdmin } from '../../api/pedidos.js'
import { avisarCambioDeInventario } from '../../hooks/useAlertasDeInventario.js'
import { useCambiosDelPedido, usePedidoAdmin } from '../../hooks/usePedidosAdmin.js'
import { CANALES, ESTADOS, MODALIDADES, accionesDelPedido, describirCambio } from '../../utils/pedidosAdmin.js'
import { OrderStatusChip, PaymentStatusChip } from './OrderChips.jsx'
import OrderLines from './OrderLines.jsx'

const formatDate = (fecha) => dateTimeFormat.format(new Date(fecha))

// Detalle de un pedido del panel (HU-17): sus datos, los botones según el estado y los dos historiales.
function OrderDetail() {
    const { correo, numCarrito } = useParams()
    const detalle = usePedidoAdmin(correo, numCarrito)
    const cambios = useCambiosDelPedido(correo, numCarrito)
    // El pedido que respondió el último cambio. No se recarga: mientras carga se desmontaría la pantalla.
    const [updated, setUpdated] = useState(null)
    const [busy, setBusy] = useState(false)
    const [confirmingCancel, setConfirmingCancel] = useState(false)
    const [notice, setNotice] = useState(null)

    const order = updated ?? detalle.datos

    const changeStatus = async (estado) => {
        const next = await cambiarEstadoPedido(correo, numCarrito, estado)
        setUpdated(next)
        setNotice({ key: Date.now(), type: 'success', text: `El pedido quedó como «${ESTADOS[next.estado] ?? next.estado}».` })
        cambios.recargar()
        // Cancelar devuelve unidades al inventario
        if (estado === 'cancelado') avisarCambioDeInventario()
    }

    const runAction = async ({ estado }) => {
        if (estado === 'cancelado') {
            setConfirmingCancel(true)
            return
        }
        setBusy(true)
        setNotice(null)
        try {
            await changeStatus(estado)
        } catch (error) {
            // Otra persona pudo haberlo cambiado: se vuelve a leer para mostrar los botones correctos
            setNotice({ key: Date.now(), type: 'error', text: error.message })
            setUpdated(null)
            detalle.recargar()
        } finally {
            setBusy(false)
        }
    }

    const confirmCancel = async () => {
        await changeStatus('cancelado')
        setConfirmingCancel(false)
    }

    // Cambia las líneas y devuelve el pedido como quedó; si falla, quien lo pidió muestra el error junto a su control
    const editLines = async (request) => {
        setBusy(true)
        try {
            const next = await request()
            setUpdated(next)
            cambios.recargar()
            avisarCambioDeInventario()
            return next
        } catch (error) {
            // Otra persona pudo haberlo cambiado. Se lee sin recargar la pantalla, para no perder ese mensaje
            obtenerPedidoAdmin(correo, numCarrito).then(setUpdated, () => {})
            throw error
        } finally {
            setBusy(false)
        }
    }

    return (
        <main className='products'>
            <section className='products-header'>
                <div className='back-title'>
                    <BackButton fallback='/admin/pedidos' />
                    <h1>Pedido n.º {numCarrito}</h1>
                </div>
            </section>

            {notice && (
                <Notice key={notice.key} type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>
            )}

            {!order && detalle.cargando ? (
                <p className='products-status' role='status'>Cargando pedido…</p>
            ) : !order ? (
                <div className='products-status products-status-error' role='alert'>
                    <p>{detalle.error}</p>
                    <button type='button' className='products-status-button' onClick={detalle.recargar}>
                        Reintentar
                    </button>
                </div>
            ) : (
                <OrderContent order={order} cambios={cambios} busy={busy} onAction={runAction} onEdit={editLines} />
            )}

            {confirmingCancel && (
                <ConfirmDialog
                    title={`¿Cancelar el pedido n.º ${numCarrito}?`}
                    message='Las unidades vuelven al inventario y lo ya cobrado queda como crédito a favor del cliente. Esto no se puede deshacer.'
                    confirmLabel='Cancelar pedido'
                    busyLabel='Cancelando…'
                    cancelLabel='Volver'
                    onConfirm={confirmCancel}
                    onCancel={() => setConfirmingCancel(false)}
                />
            )}
        </main>
    )
}

function OrderContent({ order, cambios, busy, onAction, onEdit }) {
    const actions = accionesDelPedido(order.estado, order.estadosSiguientes)
    const changes = cambios.datos?.datos ?? []
    const changesTotal = cambios.datos?.meta.total ?? 0

    return (
        <>
            <section className='order-card'>
                <div className='order-status-row'>
                    <OrderStatusChip estado={order.estado} />
                    <PaymentStatusChip estadoPago={order.pagos[0]?.estadoPago} />
                    <span className='orders-secondary'>{formatDate(order.fecha)}</span>
                </div>
                {actions.length > 0 ? (
                    <div className='order-actions'>
                        {actions.map((action, index) => (
                            <button
                                key={action.estado}
                                type='button'
                                className={`products-button ${
                                    action.estado === 'cancelado' ? 'order-button-cancel' : index === 0 ? 'products-button-primary' : ''
                                }`}
                                disabled={busy}
                                onClick={() => onAction(action)}
                            >
                                {action.etiqueta}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className='orders-secondary'>Este pedido ya no admite cambios de estado.</p>
                )}
            </section>

            <div className='order-grid'>
                <section className='order-card'>
                    <h2>Cliente</h2>
                    <dl className='order-data'>
                        <dt>Nombre</dt>
                        <dd>{order.cliente.nombre}</dd>
                        <dt>Correo</dt>
                        <dd>{order.correoCliente}</dd>
                        <dt>Cédula</dt>
                        <dd>{order.cliente.cedula ?? '—'}</dd>
                        <dt>{order.cliente.telefonos.length > 1 ? 'Teléfonos' : 'Teléfono'}</dt>
                        <dd>{order.cliente.telefonos.join(', ') || '—'}</dd>
                    </dl>
                </section>

                <section className='order-card'>
                    <h2>Entrega y origen</h2>
                    <dl className='order-data'>
                        <dt>Modalidad</dt>
                        <dd>{MODALIDADES[order.modalidadEntrega] ?? order.modalidadEntrega ?? '—'}</dd>
                        <dt>Dirección</dt>
                        <dd>{order.direccion ?? '—'}</dd>
                        {order.nombreDestinatario && (
                            <>
                                <dt>Destinatario</dt>
                                <dd>{order.nombreDestinatario}</dd>
                            </>
                        )}
                        <dt>Canal</dt>
                        <dd>{CANALES[order.canal] ?? order.canal}</dd>
                        {order.creadoPor && (
                            <>
                                <dt>Registrado por</dt>
                                <dd>{order.nombreCreadoPor ?? order.creadoPor}</dd>
                            </>
                        )}
                    </dl>
                </section>
            </div>

            <section className='order-card'>
                <OrderLines order={order} busy={busy} onEdit={onEdit} />
                <dl className='order-totals'>
                    <dt>Subtotal</dt>
                    <dd>{priceFormat.format(order.subtotal)}</dd>
                    <dt>Impuesto</dt>
                    <dd>{priceFormat.format(order.impuesto)}</dd>
                    <dt>Envío</dt>
                    <dd>{priceFormat.format(order.costoEntrega)}</dd>
                    <dt className='order-total'>Total</dt>
                    <dd className='order-total'>{priceFormat.format(order.total)}</dd>
                    {order.creditoOtorgado > 0 && (
                        <>
                            <dt>Crédito a favor del cliente</dt>
                            <dd>{priceFormat.format(order.creditoOtorgado)}</dd>
                        </>
                    )}
                </dl>
                {order.factura && <p className='orders-secondary'>Factura n.º {order.factura.numFactura}</p>}
            </section>

            <div className='order-grid'>
                <section className='order-card'>
                    <h2>Historial de estados</h2>
                    <ol className='order-history'>
                        {order.historial.map(({ estado, fecha }) => (
                            <li key={`${estado}-${fecha}`}>
                                <OrderStatusChip estado={estado} />
                                <span className='orders-secondary'>{formatDate(fecha)}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className='order-card'>
                    <h2>Historial de cambios</h2>
                    {cambios.cargando && changes.length === 0 ? (
                        <p className='orders-secondary' role='status'>Cargando cambios…</p>
                    ) : cambios.error ? (
                        <p className='product-form-alert' role='alert'>{cambios.error}</p>
                    ) : changes.length === 0 ? (
                        <p className='orders-secondary'>Todavía no hay cambios registrados.</p>
                    ) : (
                        <>
                            <ul className='order-history'>
                                {changes.map((change, index) => (
                                    <li key={`${change.fecha}-${change.evento}-${index}`}>
                                        <span>{describirCambio(change)}</span>
                                        <span className='orders-secondary'>
                                            {[formatDate(change.fecha), change.nombreUsuario ?? change.usuario].filter(Boolean).join(' · ')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            {changesTotal > changes.length && (
                                <p className='orders-secondary'>Se muestran los {changes.length} más recientes de {changesTotal}.</p>
                            )}
                        </>
                    )}
                </section>
            </div>
        </>
    )
}

export default OrderDetail
