import { Minus, Plus } from 'lucide-react'
import './QuantityStepper.css'
import { aCantidad, CANTIDAD_MAXIMA } from '../../utils/carrito.js'

// Selector de cantidad de la ficha y del carrito: los botones de - y + con el campo en el medio.
// `value` es texto para poder borrar el campo mientras se escribe.
// `onType` recibe lo que se escribe, `onStep` la cantidad nueva al usar los botones
// y `onDone` avisa cuando se sale del campo (o se le da Enter)
// Con `busy` los botones no hacen nada pero no se deshabilitan, asi no se pierde el foco mientras se guarda
function QuantityStepper({ id, value, onType, onStep, onDone, disabled = false, busy = false, inputAttributes }) {
    const current = aCantidad(value)

    const step = (cantidad) => {
        if (!busy) onStep(cantidad)
    }

    return (
        <div className='quantity-stepper'>
            <button
                type='button'
                aria-label='Quitar una unidad'
                onClick={() => step(current - 1)}
                disabled={disabled || current <= 1}
            >
                <Minus size={18} aria-hidden='true' />
            </button>
            <input
                id={id}
                type='text'
                inputMode='numeric'
                {...inputAttributes}
                value={value}
                // Solo deja escribir digitos
                onChange={(event) => onType(event.target.value.replace(/\D/g, '').slice(0, 3))}
                onBlur={onDone}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur()
                }}
                disabled={disabled}
                readOnly={busy}
            />
            <button
                type='button'
                aria-label='Agregar una unidad'
                onClick={() => step(current + 1)}
                disabled={disabled || current >= CANTIDAD_MAXIMA}
            >
                <Plus size={18} aria-hidden='true' />
            </button>
        </div>
    )
}

export default QuantityStepper
