import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router'
import '../../components/confirm-dialog/ConfirmDialog.css'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { adminOrderPath } from '../../routes.js'
import { dateTimeFormat } from '../merchandise/merchandiseFormat.js'
import { CANALES, MODALIDADES } from '../../utils/pedidosAdmin.js'
import { nombreDelMetodoDeVenta, subtotalDeLinea, textoDeUnidades, unidadesQueQuedan } from '../../utils/ventas.js'

function SaleDialog({ title, busy = false, onClose, children }) {
    const titleId = useId()

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === 'Escape' && !busy) onClose()
        }
        document.addEventListener('keydown', closeOnEscape)
        return () => document.removeEventListener('keydown', closeOnEscape)
    }, [busy, onClose])

    return (
        <div className='confirm-dialog-overlay' onClick={busy ? undefined : onClose}>
            <div
                className='confirm-dialog sales-dialog'
                role='dialog'
                aria-modal='true'
                aria-labelledby={titleId}
                onClick={(event) => event.stopPropagation()}
            >
                <h2 id={titleId}>{title}</h2>
                {children}
            </div>
        </div>
    )
}

// Último vistazo antes de registrar. Si el servidor lo rechaza, `onConfirm` lanza y su mensaje se queda aquí.
export function ConfirmSaleDialog({ lines, customerName, channel, shipping, total, onConfirm, onCancel }) {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)

    const confirm = async () => {
        setBusy(true)
        setError(null)
        try {
            await onConfirm()
        } catch (confirmError) {
            setError(confirmError.message)
            setBusy(false)
        }
    }

    return (
        <SaleDialog title='Confirmar venta' busy={busy} onClose={onCancel}>
            <ul className='sales-dialog-lines'>
                {lines.map((line) => (
                    <li key={line.sku}>
                        <span>
                            <strong>{line.nombre}</strong>
                            <span className='orders-secondary'>
                                {line.cantidad} × {priceFormat.format(line.precioFinal)} · {unidadesQueQuedan(line) === 1 ? 'quedará' : 'quedarán'} {textoDeUnidades(unidadesQueQuedan(line))}
                            </span>
                        </span>
                        <span className='sales-number'>{priceFormat.format(subtotalDeLinea(line))}</span>
                    </li>
                ))}
            </ul>
            <dl className='order-data'>
                <dt>Cliente</dt>
                <dd>{customerName}</dd>
                <dt>Canal</dt>
                <dd>{CANALES[channel]}</dd>
                <dt>Envío</dt>
                <dd>{priceFormat.format(shipping)}</dd>
                <dt className='sales-total'>Total</dt>
                <dd className='sales-total'>{priceFormat.format(total)}</dd>
            </dl>
            {error && <p className='confirm-dialog-error' role='alert'>{error}</p>}
            <div className='confirm-dialog-actions'>
                <button type='button' className='confirm-dialog-cancel' onClick={onCancel} disabled={busy}>Cancelar</button>
                <button type='button' className='products-button-primary' onClick={confirm} disabled={busy}>
                    {busy ? 'Registrando…' : 'Registrar'}
                </button>
            </div>
        </SaleDialog>
    )
}

// Lo que quedó registrado, con los datos que devolvió el servidor
export function SaleDetailDialog({ order, onClose }) {
    return (
        <SaleDialog title='Detalle de la venta' onClose={onClose}>
            <ul className='sales-dialog-lines'>
                {order.lineas.map((line) => (
                    <li key={line.sku}>
                        <span>
                            <strong>{line.nombre}</strong>
                            <span className='orders-secondary codigo'>{line.sku}</span>
                        </span>
                        <span className='sales-number'>× {line.cantidad}</span>
                    </li>
                ))}
            </ul>
            <dl className='order-data'>
                <dt>Pedido</dt>
                <dd>n.º {order.numCarrito}</dd>
                <dt>Fecha</dt>
                <dd>{dateTimeFormat.format(new Date(order.fecha))}</dd>
                <dt>Cliente</dt>
                <dd>{order.nombreDestinatario ?? order.cliente.nombre}</dd>
                <dt>Canal</dt>
                <dd>{CANALES[order.canal] ?? order.canal}</dd>
                <dt>Entrega</dt>
                <dd>{MODALIDADES[order.modalidadEntrega] ?? order.modalidadEntrega}</dd>
                <dt>Pago</dt>
                <dd>{nombreDelMetodoDeVenta(order.pagos[0]?.metodoPago)}</dd>
                <dt>Registrada por</dt>
                <dd>{order.nombreCreadoPor ?? order.creadoPor}</dd>
                <dt className='sales-total'>Total</dt>
                <dd className='sales-total'>{priceFormat.format(order.total)}</dd>
            </dl>
            <div className='confirm-dialog-actions'>
                <Link className='confirm-dialog-cancel sales-dialog-link' to={adminOrderPath(order.correoCliente, order.numCarrito)}>
                    Ver pedido
                </Link>
                <button type='button' className='products-button-primary' onClick={onClose} autoFocus>Cerrar</button>
            </div>
        </SaleDialog>
    )
}
