import { Link, useLocation } from 'react-router'
import { ChevronRight, Package } from 'lucide-react'
import './MyOrders.css'
import { OrderStatusChip } from '../orders/OrderChips.jsx'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { listarMisPedidos } from '../../api/pedidos.js'
import { useRecursoRemoto } from '../../hooks/useRecursoRemoto.js'
import { useRestaurarScroll } from '../../hooks/useRestaurarScroll.js'
import { useSesion } from '../../hooks/useSesion.js'
import { backState, catalogPath, myOrderPath } from '../../routes.js'

const dateFormat = new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' })

// Lista de los pedidos del cliente con el estado vigente, del mas nuevo al mas viejo.
// Se pide cada vez que se entra, asi sale el estado que puso el administrador.
// Los filtros del historial quedan para otro sprint
function MyOrders() {
    const { usuario } = useSesion()
    const location = useLocation()
    const pedidos = useRecursoRemoto((signal) => listarMisPedidos({ signal }), [usuario.correo])

    useRestaurarScroll(!pedidos.cargando)

    return (
        <main className='my-orders'>
            <h1 className='my-orders-title'>Mis pedidos</h1>

            {pedidos.cargando && <p className='my-orders-card my-orders-status' role='status'>Cargando tus pedidos…</p>}

            {pedidos.error && (
                <div className='my-orders-card my-orders-status my-orders-status-error' role='alert'>
                    <p>{pedidos.error}</p>
                    <button type='button' className='my-orders-button' onClick={pedidos.recargar}>Reintentar</button>
                </div>
            )}

            {pedidos.datos?.length === 0 && (
                <div className='my-orders-card my-orders-status'>
                    <Package size={40} aria-hidden='true' />
                    <p className='my-orders-status-title'>Todavía no tienes pedidos.</p>
                    <Link to={catalogPath()} className='my-orders-button'>Ver el catálogo</Link>
                </div>
            )}

            {pedidos.datos?.length > 0 && (
                <ul className='my-orders-card my-orders-list' aria-label='Tus pedidos'>
                    {pedidos.datos.map((pedido) => (
                        <li key={pedido.numCarrito}>
                            {/* El detalle vuelve aqui con su flecha */}
                            <Link to={myOrderPath(pedido.numCarrito)} state={backState(location)} className='my-orders-row'>
                                <span className='my-orders-row-main'>
                                    <strong>Pedido n.º {pedido.numCarrito}</strong>
                                    <span>{dateFormat.format(new Date(pedido.fecha))}</span>
                                </span>
                                <OrderStatusChip estado={pedido.estado} />
                                <span className='my-orders-row-total'>{priceFormat.format(pedido.total)}</span>
                                <ChevronRight size={20} aria-hidden='true' />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    )
}

export default MyOrders
