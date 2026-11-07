import { priceFormat } from '../../components/product-card/productFormat.js'
import { useCarrito } from '../../hooks/useCarrito.js'
import { useRecursoRemoto } from '../../hooks/useRecursoRemoto.js'
import { avisoDeLinea, totalDeLinea } from '../../utils/carrito.js'
import { nombreDelMetodo, ultimosDigitos } from '../../utils/checkout.js'
import StepTitle from './StepTitle.jsx'

const CARD = 'tarjeta'
const DELIVERY_STEP = 1
const PAYMENT_STEP = 2

// Paso 3: todo lo que se va a comprar y el boton de confirmar.
// Al entrar se vuelve a pedir el carrito, asi el total que se ve es el de hoy
function ReviewStep({
    delivery, deliveryName, needsAddress, payment, creditUsed = 0, creditCoversAll = false,
    sending, error, onEdit, onBack, onConfirm,
}) {
    const { carrito, actualizar } = useCarrito()
    const consulta = useRecursoRemoto((signal) => actualizar(signal), [])

    return (
        <div className='checkout-form'>
            <StepTitle>Revisa tu pedido</StepTitle>

            {error && <p className='checkout-error' role='alert'>{error}</p>}
            {consulta.error && (
                <div className='checkout-error' role='alert'>
                    <p>{consulta.error}</p>
                    <button type='button' className='checkout-link' onClick={consulta.recargar}>Reintentar</button>
                </div>
            )}

            <ul className='checkout-review-lines' aria-label='Productos del pedido'>
                {carrito.lineas.map((linea) => (
                    <li key={linea.sku}>
                        <div>
                            <span className='checkout-review-name'>{linea.cantidad} × {linea.nombre}</span>
                            {avisoDeLinea(linea) && <span className='chip chip-aviso'>{avisoDeLinea(linea)}</span>}
                        </div>
                        <span className='checkout-review-price'>{priceFormat.format(totalDeLinea(linea))}</span>
                    </li>
                ))}
            </ul>

            <ReviewBlock title='Entrega' onEdit={() => onEdit(DELIVERY_STEP)} editLabel='Cambiar la entrega'>
                <p>{deliveryName}</p>
                {needsAddress && <p>{delivery.direccion.trim()}</p>}
            </ReviewBlock>

            <ReviewBlock title='Pago' onEdit={() => onEdit(PAYMENT_STEP)} editLabel='Cambiar el pago'>
                {creditUsed > 0 && <p>Crédito a favor: {priceFormat.format(creditUsed)}</p>}
                {!creditCoversAll && (
                    <p>
                        {nombreDelMetodo(payment.metodoPago)}
                        {payment.metodoPago === CARD && ` terminada en ${ultimosDigitos(payment.numeroTarjeta)}`}
                    </p>
                )}
            </ReviewBlock>

            <div className='checkout-actions checkout-actions-between'>
                <button type='button' className='checkout-secondary' onClick={onBack} disabled={sending}>Volver</button>
                {/* Deshabilitado mientras se envia para que un doble clic no cobre dos veces */}
                <button
                    type='button'
                    className='checkout-primary'
                    onClick={onConfirm}
                    disabled={sending || consulta.cargando || Boolean(consulta.error)}
                >
                    {sending ? 'Procesando…' : 'Confirmar y pagar'}
                </button>
            </div>
        </div>
    )
}

function ReviewBlock({ title, onEdit, editLabel, children }) {
    return (
        <section className='checkout-review-block'>
            <div>
                <h3>{title}</h3>
                {children}
            </div>
            <button type='button' className='checkout-link' aria-label={editLabel} onClick={onEdit}>Cambiar</button>
        </section>
    )
}

export default ReviewStep
