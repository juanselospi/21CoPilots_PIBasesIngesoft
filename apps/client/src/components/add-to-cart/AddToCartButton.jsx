import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import './AddToCartButton.css'
import { useCarrito } from '../../hooks/useCarrito.js'
import { useSesion } from '../../hooks/useSesion.js'
import { avisoDeContrapedido } from '../../utils/carrito.js'
import { guardarPendiente } from '../../utils/carritoPendiente.js'

const CLIENT_ROLE = 'cliente'
// Lo que dura el mensaje de "agregado" antes de quitarse solo
const SUCCESS_TIME = 5000

// Boton "Agregar al carrito" de la tarjeta y de la ficha, con el mensaje de como salio debajo.
// El visitante va a /acceso y regresa a esta misma pagina despues de entrar; lo que quiso agregar
// queda guardado y se agrega solo cuando entra.
// `className` es el estilo del boton, cambia entre la tarjeta y la ficha
function AddToCartButton({ sku, quantity = 1, className, onAdded }) {
    const { usuario, cargando } = useSesion()
    const { agregar, resultadoPendiente, olvidarResultadoPendiente } = useCarrito()
    const navigate = useNavigate()
    const location = useLocation()
    const [adding, setAdding] = useState(false)
    const [message, setMessage] = useState(null)

    // El mensaje de exito se quita solo, el de error se queda hasta el siguiente intento
    useEffect(() => {
        if (message?.type !== 'ok') return
        const timer = setTimeout(() => setMessage(null), SUCCESS_TIME)
        return () => clearTimeout(timer)
    }, [message])

    // Si este producto es el que quedo pendiente antes de entrar, el boton dice como salio
    const pendingMessage = resultadoPendiente?.sku === sku ? mensajeDelPendiente(resultadoPendiente, sku) : null
    const shown = message ?? pendingMessage

    useEffect(() => {
        if (pendingMessage?.type !== 'ok') return
        const timer = setTimeout(olvidarResultadoPendiente, SUCCESS_TIME)
        return () => clearTimeout(timer)
    }, [pendingMessage?.type, olvidarResultadoPendiente])

    const handleClick = async () => {
        if (adding) return
        olvidarResultadoPendiente()

        if (!usuario) {
            guardarPendiente(sku, quantity)
            const volver = encodeURIComponent(location.pathname + location.search)
            navigate(`/acceso?volver=${volver}`)
            return
        }

        // El administrador tambien va a tener carrito pero eso queda para otro sprint,
        // por ahora el boton se ve pero no hace nada
        if (usuario.rol !== CLIENT_ROLE) return

        setAdding(true)
        setMessage(null)
        try {
            const carrito = await agregar(sku, quantity)
            setMessage({ type: 'ok', backorder: avisoDeContrapedido(carrito, sku) })
            onAdded?.()
        } catch (addError) {
            // Aqui llega el 409 del servidor, por ejemplo "El máximo disponible es 3."
            // Si la sesion vencio SessionProvider ya mando a /acceso
            setMessage({ type: 'error', text: addError.message })
        }
        setAdding(false)
    }

    return (
        <div className='add-to-cart'>
            <button type='button' className={className} onClick={handleClick} disabled={adding || cargando}>
                {adding ? 'Agregando…' : 'Agregar al carrito'}
            </button>

            {/* El contenedor siempre esta para que el lector de pantalla lea el mensaje cuando aparece */}
            <div role='status' className='add-to-cart-messages'>
                {shown?.type === 'ok' && <p className='add-to-cart-message add-to-cart-ok'>Agregado al carrito.</p>}
                {shown?.backorder && <p className='add-to-cart-message add-to-cart-backorder'>{shown.backorder}</p>}
            </div>
            {shown?.type === 'error' && (
                <p className='add-to-cart-message add-to-cart-error' role='alert'>{shown.text}</p>
            )}
        </div>
    )
}

// Lo que salio al agregar lo pendiente, con la misma forma que el mensaje del boton
const mensajeDelPendiente = (resultado, sku) => (resultado.error
    ? { type: 'error', text: resultado.error }
    : { type: 'ok', backorder: avisoDeContrapedido(resultado.carrito, sku) })

export default AddToCartButton
