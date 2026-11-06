import { useEffect, useId, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ShoppingCart, TriangleAlert } from 'lucide-react'
import './Cart.css'
import CartLine from './CartLine.jsx'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { useCarrito } from '../../hooks/useCarrito.js'
import { useRecursoRemoto } from '../../hooks/useRecursoRemoto.js'
import { useRestaurarScroll } from '../../hooks/useRestaurarScroll.js'
import { useSesion } from '../../hooks/useSesion.js'
import { CHECKOUT_PATH, catalogPath } from '../../routes.js'
import { hayFueraDeStock } from '../../utils/carrito.js'

// Despues de iniciar sesion el visitante regresa al carrito
const LOGIN_PATH = `/acceso?volver=${encodeURIComponent('/carrito')}`

// Pagina del carrito con las lineas, los totales y el boton "Finalizar compra".
// El visitante y el administrador no tienen carrito, asi que lo ven vacio
function Cart() {
    const { usuario, cargando: loadingSession } = useSesion()
    const { carrito, actualizar } = useCarrito()
    // Al entrar se vuelve a pedir el carrito, asi salen los precios y las existencias de hoy
    // y no los de cuando se agrego el producto
    const consulta = useRecursoRemoto((signal) => actualizar(signal), [usuario?.correo ?? null])
    const loading = loadingSession || consulta.cargando
    const location = useLocation()
    const navigate = useNavigate()
    // El checkout manda aqui un aviso si ya no alcanzan las existencias. Se guarda y se borra del
    // historial, asi no vuelve a salir si se recarga la pagina
    const [notice] = useState(location.state?.aviso ?? null)

    useEffect(() => {
        if (location.state?.aviso) navigate(location.pathname, { replace: true, state: null })
    }, [location.state, location.pathname, navigate])

    useRestaurarScroll(!loading)

    return (
        <main className='cart'>
            <h1 className='cart-section cart-title'>Carrito</h1>

            {notice && (
                <p className='cart-section cart-notice' role='alert'>
                    <TriangleAlert size={18} aria-hidden='true' />
                    {notice}
                </p>
            )}

            {loading ? (
                <p className='cart-section cart-status' role='status'>Cargando tu carrito…</p>
            ) : consulta.error ? (
                <div className='cart-section cart-status cart-status-error' role='alert'>
                    <p>{consulta.error}</p>
                    <button type='button' className='cart-status-button' onClick={consulta.recargar}>
                        Reintentar
                    </button>
                </div>
            ) : !carrito || carrito.lineas.length === 0 ? (
                <EmptyCart visitor={!usuario} />
            ) : (
                <div className='cart-section cart-content'>
                    <ul className='cart-lines' aria-label='Productos del carrito'>
                        {carrito.lineas.map((linea) => <CartLine key={linea.sku} linea={linea} />)}
                    </ul>

                    <Summary carrito={carrito} />
                </div>
            )}
        </main>
    )
}

// Carrito vacio con el enlace al catalogo. Al visitante ademas se le recuerda que puede iniciar sesion
function EmptyCart({ visitor }) {
    return (
        <div className='cart-section cart-status'>
            <ShoppingCart size={40} aria-hidden='true' />
            <p className='cart-status-title'>Tu carrito está vacío.</p>
            {visitor && (
                <p>Si ya tenías productos guardados, <Link to={LOGIN_PATH}>inicia sesión</Link> para verlos.</p>
            )}
            <Link to={catalogPath()} className='cart-status-button'>Ver el catálogo</Link>
        </div>
    )
}

// Subtotal, impuesto y total como los calcula el servidor, y el boton para finalizar la compra.
// Con una linea fuera de stock el boton se deshabilita hasta que se quite
function Summary({ carrito }) {
    const blocked = hayFueraDeStock(carrito)
    const titleId = useId()
    const warningId = useId()

    return (
        <section className='cart-summary' aria-labelledby={titleId}>
            <h2 id={titleId}>Resumen</h2>

            <dl className='cart-totals'>
                <div>
                    <dt>Subtotal</dt>
                    <dd>{priceFormat.format(carrito.subtotal)}</dd>
                </div>
                <div>
                    <dt>Impuesto</dt>
                    <dd>{priceFormat.format(carrito.impuesto)}</dd>
                </div>
                <div className='cart-total'>
                    <dt>Total</dt>
                    <dd>{priceFormat.format(carrito.total)}</dd>
                </div>
            </dl>

            <p className='cart-summary-note'>El envío se calcula al finalizar la compra.</p>

            {blocked ? (
                <>
                    <p id={warningId} className='cart-summary-warning'>
                        <TriangleAlert size={18} aria-hidden='true' />
                        Quita los productos fuera de stock para finalizar la compra.
                    </p>
                    <button type='button' className='cart-checkout' disabled aria-describedby={warningId}>
                        Finalizar compra
                    </button>
                </>
            ) : (
                <Link to={CHECKOUT_PATH} className='cart-checkout'>Finalizar compra</Link>
            )}

            <Link to={catalogPath()} className='cart-keep-shopping'>Seguir comprando</Link>
        </section>
    )
}

export default Cart
