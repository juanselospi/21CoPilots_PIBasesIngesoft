import { useEffect, useId, useState } from 'react'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import {
    METODOS_DE_PAGO, camposDelPago, creditoQueSeUsa, formatoVencimiento, reglasDePago, restantePorPagar,
} from '../../utils/checkout.js'
import StepTitle from './StepTitle.jsx'

const CARD = 'tarjeta'
const descriptions = {
    sinpe_movil: 'El pago es emulado y se aprueba al confirmar el pedido.',
    contra_entrega: 'Pagas cuando recibes el pedido. La factura se emite cuando se pague.',
}

// Paso 2: el medio de pago. El pago es emulado, los datos de la tarjeta solo sirven para probar
// y el autocompletado va apagado para que el navegador no ofrezca guardarlos.
// El nivel de fidelidad todavia no existe, asi que contra entrega le sale a todos por ahora, queda para otro sprint.
// Con saldo a favor se puede usar el credito: si alcanza no hace falta otro medio de pago
function PaymentStep({ values, saldoCredito = 0, total, serverError, onBack, onContinue }) {
    // Las reglas dependen del metodo y del credito, por eso van aparte y no salen de los valores del formulario
    const [method, setMethod] = useState(values.metodoPago)
    const [useCredit, setUseCredit] = useState(values.usarCredito)
    const creditUsed = creditoQueSeUsa({ usarCredito: useCredit }, saldoCredito, total)
    const remaining = restantePorPagar(total, creditUsed)
    const creditCoversAll = creditUsed > 0 && remaining === 0
    const {
        valores, errores, formularioRef, cambiarCampo, validar, erroresServidor, atributosCampo, idError,
    } = useFormulario(values, reglasDePago(method, undefined, { creditoCubreTodo: creditCoversAll }))

    // Si el servidor rechazo algo de este paso, al volver aqui sale marcado
    useEffect(() => {
        if (serverError) erroresServidor(camposDelPago(serverError.campos), serverError.message)
        // Solo al entrar al paso
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const selectMethod = (metodo) => {
        cambiarCampo('metodoPago', metodo)
        setMethod(metodo)
    }

    const toggleCredit = (usar) => {
        cambiarCampo('usarCredito', usar)
        setUseCredit(usar)
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        if (validar()) onContinue(valores)
    }

    const cardField = (campo, label, props) => (
        <CardField
            label={label}
            value={valores[campo]}
            onChange={(valor) => cambiarCampo(campo, valor)}
            inputAttributes={atributosCampo(campo)}
            error={errores[campo]}
            errorId={idError(campo)}
            {...props}
        />
    )

    return (
        <form ref={formularioRef} className='checkout-form' onSubmit={handleSubmit} noValidate>
            <StepTitle>¿Cómo quieres pagar?</StepTitle>

            {saldoCredito > 0 && (
                <label className='checkout-option'>
                    <input
                        type='checkbox'
                        name='usarCredito'
                        checked={valores.usarCredito}
                        onChange={(event) => toggleCredit(event.target.checked)}
                    />
                    <span className='checkout-option-name'>Usar mi crédito a favor</span>
                    <span className='checkout-option-price'>{priceFormat.format(saldoCredito)} disponible</span>
                </label>
            )}

            {creditUsed > 0 && (
                <p className='checkout-hint'>
                    {creditCoversAll
                        ? `Tu crédito cubre todo el pedido: se usan ${priceFormat.format(creditUsed)}.`
                        : `Se usan ${priceFormat.format(creditUsed)} de tu crédito. Los ${priceFormat.format(remaining)} que faltan los pagas con:`}
                </p>
            )}

            {/* Si el credito alcanza no hay nada mas que escoger */}
            {!creditCoversAll && (
                <>
                    <fieldset
                        className='checkout-options'
                        aria-describedby={errores.metodoPago ? idError('metodoPago') : undefined}
                    >
                        <legend>Medio de pago</legend>
                        {METODOS_DE_PAGO.map(({ metodo, nombre }) => (
                            <label key={metodo} className='checkout-option'>
                                <input
                                    type='radio'
                                    name='metodoPago'
                                    value={metodo}
                                    checked={valores.metodoPago === metodo}
                                    onChange={() => selectMethod(metodo)}
                                />
                                <span className='checkout-option-name'>{nombre}</span>
                            </label>
                        ))}
                        {errores.metodoPago && (
                            <p id={idError('metodoPago')} className='checkout-field-error'>{errores.metodoPago}</p>
                        )}
                    </fieldset>

                    {descriptions[method] && <p className='checkout-hint'>{descriptions[method]}</p>}

                    {method === CARD && (
                        <>
                            <p className='checkout-emulated'>Pago emulado: no se hace ningún cobro. No uses los datos de una tarjeta real.</p>

                            {cardField('numeroTarjeta', 'Número de tarjeta', { placeholder: '0000 0000 0000 0000', maxLength: 23 })}

                            <div className='checkout-row'>
                                {cardField('vencimiento', 'Vencimiento', {
                                    placeholder: 'MM/AA',
                                    maxLength: 5,
                                    format: formatoVencimiento,
                                })}
                                {cardField('cvv', 'CVV', { type: 'password', placeholder: '123', maxLength: 4 })}
                            </div>
                        </>
                    )}
                </>
            )}

            <div className='checkout-actions checkout-actions-between'>
                <button type='button' className='checkout-secondary' onClick={() => onBack(valores)}>Volver</button>
                <button type='submit' className='checkout-primary'>Revisar el pedido</button>
            </div>
        </form>
    )
}

// `format` deja el texto como tiene que verse mientras se escribe, por ejemplo la barra del vencimiento
function CardField({ label, value, onChange, inputAttributes, error, errorId, type = 'text', format, ...props }) {
    const inputId = useId()

    return (
        <div className='checkout-field'>
            <label htmlFor={inputId}>{label}</label>
            <input
                id={inputId}
                type={type}
                inputMode='numeric'
                autoComplete='off'
                {...props}
                {...inputAttributes}
                value={value}
                onChange={(event) => onChange(format ? format(event.target.value) : event.target.value)}
            />
            {error && <p id={errorId} className='checkout-field-error'>{error}</p>}
        </div>
    )
}

export default PaymentStep
