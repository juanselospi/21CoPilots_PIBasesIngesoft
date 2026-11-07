import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { CircleX } from 'lucide-react'
import './Checkout.css'
import CheckoutSummary from './CheckoutSummary.jsx'
import DeliveryStep from './DeliveryStep.jsx'
import PaymentStep from './PaymentStep.jsx'
import ReviewStep from './ReviewStep.jsx'
import BackButton from '../../components/back-button/BackButton.jsx'
import { obtenerMiCuenta } from '../../api/clientes.js'
import { confirmarPedido, listarModalidades } from '../../api/pedidos.js'
import { useCarrito } from '../../hooks/useCarrito.js'
import { useRecursoRemoto } from '../../hooks/useRecursoRemoto.js'
import { useSesion } from '../../hooks/useSesion.js'
import { CHECKOUT_PATH, CONFIRMATION_PATH } from '../../routes.js'
import { hayFueraDeStock } from '../../utils/carrito.js'
import {
    ENTREGA_VACIA, PAGO_VACIO, creditoQueSeUsa, cuerpoDeConfirmacion, pasoDeLosCampos, restantePorPagar, totalConEnvio,
} from '../../utils/checkout.js'

const CLIENT_ROLE = 'cliente'
const CART_PATH = '/carrito'
const REJECTED_PAYMENT = 'PAGO_RECHAZADO'
// Con estos el pedido no se puede crear como esta el carrito, asi que se devuelve a revisarlo
const CART_ERRORS = ['SIN_EXISTENCIAS', 'REGLA_DE_NEGOCIO_VIOLADA']
const OUT_OF_STOCK_NOTICE = 'Hay productos fuera de stock en tu carrito. Quítalos para finalizar la compra.'

const STEPS = ['Entrega', 'Pago', 'Resumen']
const DELIVERY_STEP = 1
const PAYMENT_STEP = 2
const REVIEW_STEP = 3

// Pagina para finalizar la compra. Sin sesion primero hay que entrar o crear la cuenta (el paso 0).
// El administrador todavia no tiene carrito, asi que va a /carrito que le sale vacio
function Checkout() {
    const { usuario, cargando } = useSesion()

    if (cargando) return <CheckoutStatus>Verificando sesión…</CheckoutStatus>
    if (!usuario) return <SignInStep />
    if (usuario.rol !== CLIENT_ROLE) return <Navigate to={CART_PATH} replace />

    return <CheckoutLoader email={usuario.correo} />
}

function CheckoutStatus({ children }) {
    return (
        <main className='checkout'>
            <p className='checkout-section checkout-status' role='status'>{children}</p>
        </main>
    )
}

// Paso 0: despues de entrar o crear la cuenta regresa aqui con ?volver=
function SignInStep() {
    const back = encodeURIComponent(CHECKOUT_PATH)

    return (
        <main className='checkout'>
            <div className='checkout-section checkout-status'>
                <p className='checkout-status-title'>Inicia sesión para finalizar tu compra</p>
                <p>Necesitamos tu cuenta para la entrega y la factura.</p>
                <div className='checkout-actions'>
                    <Link to={`/acceso?pestana=crear-cuenta&volver=${back}`} className='checkout-secondary'>Crear cuenta</Link>
                    <Link to={`/acceso?volver=${back}`} className='checkout-primary'>Iniciar sesión</Link>
                </div>
            </div>
        </main>
    )
}

// Trae el carrito de hoy, la cuenta (por la direccion) y las modalidades antes de mostrar los pasos.
// Si el carrito queda vacio o con algo fuera de stock, aqui no hay nada que comprar y se regresa
function CheckoutLoader({ email }) {
    const { carrito, actualizar } = useCarrito()
    const consulta = useRecursoRemoto(async (signal) => {
        const [, account, deliveries] = await Promise.all([
            actualizar(signal),
            obtenerMiCuenta({ signal }),
            listarModalidades({ signal }),
        ])
        return { account, deliveries }
    }, [email])

    if (consulta.cargando) return <CheckoutStatus>Preparando tu compra…</CheckoutStatus>

    if (consulta.error) {
        return (
            <main className='checkout'>
                <div className='checkout-section checkout-status checkout-status-error' role='alert'>
                    <p>{consulta.error}</p>
                    <button type='button' className='checkout-primary' onClick={consulta.recargar}>Reintentar</button>
                </div>
            </main>
        )
    }

    if (!carrito || carrito.lineas.length === 0) return <Navigate to={CART_PATH} replace />
    if (hayFueraDeStock(carrito)) return <Navigate to={CART_PATH} replace state={{ aviso: OUT_OF_STOCK_NOTICE }} />

    return <CheckoutSteps account={consulta.datos.account} deliveries={consulta.datos.deliveries} />
}

// Los tres pasos. Lo que se va llenando vive aqui y solo en memoria, asi los datos de la tarjeta
// nunca quedan en la URL, en el historial ni en el navegador
function CheckoutSteps({ account, deliveries }) {
    const navigate = useNavigate()
    const { carrito } = useCarrito()
    const [step, setStep] = useState(DELIVERY_STEP)
    // La direccion va llena con la de Mi cuenta, pero cambiarla aqui solo aplica a este pedido
    const [delivery, setDelivery] = useState({ ...ENTREGA_VACIA, direccion: account.direccion ?? '' })
    const [payment, setPayment] = useState(PAGO_VACIO)
    const [sending, setSending] = useState(false)
    const [reviewError, setReviewError] = useState(null)
    // Lo que rechazo el servidor en un campo de otro paso: { message, campos }
    const [stepError, setStepError] = useState(null)
    const [rejected, setRejected] = useState(null)

    const selectedDelivery = deliveries.find(({ modalidad }) => modalidad === delivery.modalidadEntrega)
    // El saldo a favor viene con la cuenta; se usa solo si el cliente lo marca en el pago
    const creditBalance = account.saldoCredito ?? 0
    const total = totalConEnvio(carrito, selectedDelivery)
    const creditUsed = creditoQueSeUsa(payment, creditBalance, total)
    const creditCoversAll = creditUsed > 0 && restantePorPagar(total, creditUsed) === 0

    const goToStep = (next) => {
        setReviewError(null)
        setStep(next)
    }

    const handleConfirm = async () => {
        if (sending) return

        setSending(true)
        setReviewError(null)
        try {
            const pedido = await confirmarPedido(
                cuerpoDeConfirmacion(delivery, payment, selectedDelivery, { creditoCubreTodo: creditCoversAll }),
            )
            // Con replace no se puede volver atras a un checkout que ya se pago
            navigate(CONFIRMATION_PATH, { replace: true, state: { pedido, deliveryName: selectedDelivery.nombre } })
        } catch (confirmError) {
            setSending(false)
            handleConfirmError(confirmError)
        }
    }

    const handleConfirmError = (confirmError) => {
        if (confirmError.codigo === REJECTED_PAYMENT) {
            setRejected(confirmError.message)
            return
        }
        // Al entrar al carrito se vuelve a pedir, asi las lineas salen marcadas fuera de stock
        if (CART_ERRORS.includes(confirmError.codigo)) {
            navigate(CART_PATH, { replace: true, state: { aviso: confirmError.message } })
            return
        }

        const campos = confirmError.detalles?.campos
        const errorStep = pasoDeLosCampos(campos)
        if (errorStep) {
            setStepError({ message: confirmError.message, campos })
            goToStep(errorStep)
            return
        }
        // Si la sesion vencio no hay que hacer nada mas, SessionProvider ya mando a /acceso
        setReviewError(confirmError.message)
    }

    // Reintentar vuelve al pago con los datos de la tarjeta borrados, la entrega se queda igual
    const retryPayment = () => {
        setPayment((actual) => ({ ...PAGO_VACIO, metodoPago: actual.metodoPago }))
        setRejected(null)
        goToStep(PAYMENT_STEP)
    }

    if (rejected) return <PaymentRejected message={rejected} onRetry={retryPayment} />

    return (
        <main className='checkout'>
            <div className='checkout-section checkout-heading'>
                <BackButton fallback={CART_PATH} label='Volver al carrito' />
                <h1 className='checkout-title'>Finalizar compra</h1>
                <ol className='checkout-steps'>
                    {STEPS.map((name, index) => (
                        <li
                            key={name}
                            className={index + 1 === step ? 'checkout-step checkout-step-active' : 'checkout-step'}
                            aria-current={index + 1 === step ? 'step' : undefined}
                        >
                            <span aria-hidden='true'>{index + 1}</span>
                            {name}
                        </li>
                    ))}
                </ol>
            </div>

            <div className='checkout-section checkout-content'>
                <section className='checkout-card'>
                    {step === DELIVERY_STEP && (
                        <DeliveryStep
                            deliveries={deliveries}
                            values={delivery}
                            selected={selectedDelivery}
                            onSelect={(modalidadEntrega) => setDelivery((actual) => ({ ...actual, modalidadEntrega }))}
                            serverError={stepError}
                            onContinue={(values) => {
                                setDelivery(values)
                                setStepError(null)
                                goToStep(PAYMENT_STEP)
                            }}
                        />
                    )}

                    {step === PAYMENT_STEP && (
                        <PaymentStep
                            values={payment}
                            saldoCredito={creditBalance}
                            total={total}
                            serverError={stepError}
                            onBack={(values) => {
                                setPayment(values)
                                setStepError(null)
                                goToStep(DELIVERY_STEP)
                            }}
                            onContinue={(values) => {
                                setPayment(values)
                                setStepError(null)
                                goToStep(REVIEW_STEP)
                            }}
                        />
                    )}

                    {step === REVIEW_STEP && (
                        <ReviewStep
                            delivery={delivery}
                            deliveryName={selectedDelivery.nombre}
                            needsAddress={selectedDelivery.exigeDireccion}
                            payment={payment}
                            creditUsed={creditUsed}
                            creditCoversAll={creditCoversAll}
                            sending={sending}
                            error={reviewError}
                            onEdit={goToStep}
                            onBack={() => goToStep(PAYMENT_STEP)}
                            onConfirm={handleConfirm}
                        />
                    )}
                </section>

                <CheckoutSummary selectedDelivery={selectedDelivery} creditUsed={creditUsed} />
            </div>
        </main>
    )
}

// El pedido no se creo y el carrito sigue igual, se puede intentar otra vez o con otro medio de pago
function PaymentRejected({ message, onRetry }) {
    return (
        <main className='checkout'>
            <div className='checkout-section checkout-status checkout-rejected' role='alert'>
                <CircleX size={48} aria-hidden='true' />
                <h1 className='checkout-status-title'>Tu pago fue rechazado</h1>
                <p>{message}</p>
                <div className='checkout-actions'>
                    <Link to={CART_PATH} className='checkout-secondary'>Volver al carrito</Link>
                    <button type='button' className='checkout-primary' onClick={onRetry}>Reintentar</button>
                </div>
            </div>
        </main>
    )
}

export default Checkout
