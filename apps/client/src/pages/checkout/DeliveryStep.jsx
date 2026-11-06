import { useEffect, useId } from 'react'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import { reglasDeEntrega } from '../../utils/checkout.js'
import { LIMITE_DIRECCION } from '../../utils/datosDeContacto.js'
import StepTitle from './StepTitle.jsx'

// Paso 1: la modalidad con su costo y la direccion, que no se pide con "Entrega personal"
function DeliveryStep({ deliveries, values, selected, onSelect, serverError, onContinue }) {
    const {
        valores, errores, formularioRef, cambiarCampo, validar, erroresServidor, atributosCampo, idError,
    } = useFormulario(values, reglasDeEntrega(selected))
    const addressId = useId()
    const hintId = useId()

    // Si el servidor rechazo algo de este paso, al volver aqui sale marcado
    useEffect(() => {
        if (serverError) erroresServidor(serverError.campos, serverError.message)
        // Solo al entrar al paso
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const selectDelivery = (modalidad) => {
        cambiarCampo('modalidadEntrega', modalidad)
        onSelect(modalidad)
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        if (validar()) onContinue(valores)
    }

    const addressAttributes = atributosCampo('direccion')

    return (
        <form ref={formularioRef} className='checkout-form' onSubmit={handleSubmit} noValidate>
            <StepTitle>¿Cómo quieres recibir tu pedido?</StepTitle>

            <fieldset
                className='checkout-options'
                aria-describedby={errores.modalidadEntrega ? idError('modalidadEntrega') : undefined}
            >
                <legend>Modalidad de entrega</legend>
                {deliveries.map(({ modalidad, nombre, costo }) => (
                    <label key={modalidad} className='checkout-option'>
                        <input
                            type='radio'
                            name='modalidadEntrega'
                            value={modalidad}
                            checked={valores.modalidadEntrega === modalidad}
                            onChange={() => selectDelivery(modalidad)}
                        />
                        <span className='checkout-option-name'>{nombre}</span>
                        <span className='checkout-option-price'>{priceFormat.format(costo)}</span>
                    </label>
                ))}
                {errores.modalidadEntrega && (
                    <p id={idError('modalidadEntrega')} className='checkout-field-error'>{errores.modalidadEntrega}</p>
                )}
            </fieldset>

            {selected?.exigeDireccion && (
                <div className='checkout-field'>
                    <label htmlFor={addressId}>Dirección de entrega</label>
                    <textarea
                        id={addressId}
                        rows={3}
                        autoComplete='street-address'
                        maxLength={LIMITE_DIRECCION}
                        placeholder='Provincia, cantón, distrito y otras señas'
                        {...addressAttributes}
                        aria-describedby={[addressAttributes['aria-describedby'], hintId].filter(Boolean).join(' ')}
                        value={valores.direccion}
                        onChange={(event) => cambiarCampo('direccion', event.target.value)}
                    />
                    {errores.direccion && <p id={idError('direccion')} className='checkout-field-error'>{errores.direccion}</p>}
                    <p id={hintId} className='checkout-hint'>Si la cambias aquí solo aplica a este pedido, la de Mi cuenta queda igual.</p>
                </div>
            )}

            {selected && !selected.exigeDireccion && (
                <p className='checkout-hint'>Coordinamos contigo la entrega, no hace falta una dirección.</p>
            )}

            <div className='checkout-actions checkout-actions-end'>
                <button type='submit' className='checkout-primary'>Continuar al pago</button>
            </div>
        </form>
    )
}

export default DeliveryStep
