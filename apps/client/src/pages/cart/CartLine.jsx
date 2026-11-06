import { useId, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ImageOff, Trash2 } from 'lucide-react'
import AvailabilityChip from '../../components/product-card/AvailabilityChip.jsx'
import QuantityStepper from '../../components/quantity-stepper/QuantityStepper.jsx'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { useCarrito } from '../../hooks/useCarrito.js'
import { backState, productPath } from '../../routes.js'
import {
    avisoDeLinea, disponibilidadDeLinea, estaFueraDeStock, precioDeLinea, reglasCantidad, totalDeLinea,
} from '../../utils/carrito.js'
import { validarCampos } from '../../utils/validarCampos.js'

// Una linea del carrito: imagen, nombre, precio de la unidad, cantidad, total y el boton de quitar.
// Si esta fuera de stock la cantidad queda bloqueada y solo se puede quitar
function CartLine({ linea }) {
    const { cambiarCantidad, quitar } = useCarrito()
    // La ficha del producto vuelve al carrito con su flecha
    const state = backState(useLocation())
    // Se guarda como texto para poder borrar el campo mientras se escribe
    const [quantity, setQuantity] = useState(String(linea.cantidad))
    const [saving, setSaving] = useState(false)
    const [removing, setRemoving] = useState(false)
    // `field` dice si el error es de lo que se escribio en la cantidad o si lo respondio el servidor
    const [error, setError] = useState(null)
    const errorId = useId()

    const { sku, nombre, imagenUrl } = linea
    const availability = disponibilidadDeLinea(linea)
    const outOfStock = estaFueraDeStock(linea)
    const backorder = avisoDeLinea(linea)

    const save = async (cantidad) => {
        setQuantity(String(cantidad))
        setError(null)
        if (cantidad === linea.cantidad) return

        setSaving(true)
        try {
            await cambiarCantidad(sku, cantidad)
        } catch (saveError) {
            // Aqui llega el 409 del servidor, por ejemplo "El máximo disponible es 3.",
            // y la cantidad vuelve a la que tenia. Si la sesion vencio SessionProvider ya mando a /acceso
            setError({ text: saveError.message })
            setQuantity(String(linea.cantidad))
        }
        setSaving(false)
    }

    // Al salir del campo se revisa lo que se escribio y si esta bien se guarda
    const handleDone = () => {
        if (saving) return

        const { cantidad: invalid } = validarCampos({ cantidad: quantity }, reglasCantidad)
        if (invalid) {
            setError({ text: invalid, field: true })
            return
        }
        save(Number(quantity))
    }

    const remove = async () => {
        setRemoving(true)
        setError(null)
        try {
            // Si sale bien la linea desaparece, ya no hay nada mas que cambiar aqui
            await quitar(sku)
        } catch (removeError) {
            setError({ text: removeError.message })
            setRemoving(false)
        }
    }

    const image = imagenUrl ? (
        <img className='cart-line-image' src={imagenUrl} alt='' />
    ) : (
        <div className='cart-line-image cart-line-no-image'><ImageOff size={24} aria-hidden='true' />Sin imagen</div>
    )

    return (
        <li className='cart-line' aria-busy={saving || removing}>
            {/* Una linea fuera de stock no lleva a la ficha, puede que el producto ya no se muestre en la tienda */}
            {outOfStock ? image : (
                <Link to={productPath(sku)} state={state} className='cart-line-link' tabIndex={-1} aria-hidden='true'>
                    {image}
                </Link>
            )}

            <div className='cart-line-info'>
                <h2 className='cart-line-name'>
                    {outOfStock ? nombre : (
                        <Link to={productPath(sku)} state={state} className='cart-line-link'>{nombre}</Link>
                    )}
                </h2>
                <p className='cart-line-price'>
                    {priceFormat.format(precioDeLinea(linea))}
                    <span> c/u, impuesto incluido</span>
                </p>

                {/* "En existencia" no se muestra, solo lo que el cliente tiene que saber */}
                {availability !== 'in-stock' && <AvailabilityChip availability={availability} />}
                {backorder && <p className='cart-line-note'>{backorder}</p>}
                {outOfStock && <p className='cart-line-note'>Quítalo del carrito para finalizar la compra.</p>}
            </div>

            <div className='cart-line-controls'>
                <div className='cart-line-quantity'>
                    <span aria-hidden='true'>Cantidad</span>
                    <QuantityStepper
                        value={quantity}
                        onType={(texto) => {
                            setQuantity(texto)
                            setError(null)
                        }}
                        onStep={save}
                        onDone={handleDone}
                        disabled={outOfStock || removing}
                        busy={saving}
                        inputAttributes={{
                            'aria-label': `Cantidad de ${nombre}`,
                            'aria-invalid': error?.field ? true : undefined,
                            'aria-describedby': error?.field ? errorId : undefined,
                        }}
                    />
                </div>

                <p className='cart-line-total'>
                    <span>Total</span>
                    {priceFormat.format(totalDeLinea(linea))}
                </p>

                <button
                    type='button'
                    className='cart-line-remove'
                    aria-label={`Quitar ${nombre} del carrito`}
                    onClick={remove}
                    disabled={removing}
                >
                    <Trash2 size={18} aria-hidden='true' />
                    {removing ? 'Quitando…' : 'Quitar'}
                </button>
            </div>

            {error && <p id={errorId} className='cart-line-error' role='alert'>{error.text}</p>}
        </li>
    )
}

export default CartLine
