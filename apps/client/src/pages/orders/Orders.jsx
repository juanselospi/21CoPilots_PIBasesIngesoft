import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
// Mismo aspecto que la página de productos y su tabla; la paginación, como el historial de Mercancía
import '../products/Products.css'
import '../../components/product-table/ProductTable.css'
import '../merchandise/Merchandise.css'
import './Orders.css'
import Pagination from '../../components/pagination/Pagination.jsx'
import Select from '../../components/select/Select.jsx'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { dateTimeFormat } from '../merchandise/merchandiseFormat.js'
import { usePedidosAdmin } from '../../hooks/usePedidosAdmin.js'
import { adminOrderPath, backState } from '../../routes.js'
import { CANALES, ESTADOS, conCambios, leerConsulta, problemaDeBusqueda, resumenDeProductos } from '../../utils/pedidosAdmin.js'
import { OrderStatusChip, PaymentStatusChip } from './OrderChips.jsx'

// Espera para buscar hasta que el usuario deje de escribir
const SEARCH_DELAY_MS = 300
const PAGE_SIZE = 25

const toOptions = (all, labels) => [
    { value: '', label: all },
    ...Object.entries(labels).map(([value, label]) => ({ value, label })),
]

// Pantalla «Pedidos» del panel (HU-17): lista, busca y filtra; cada fila abre el detalle.
function Orders() {
    const location = useLocation()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { q, estado, canal, pagina } = leerConsulta(searchParams)
    const [search, setSearch] = useState(q)

    const change = (cambios) => setSearchParams((current) => conCambios(current, cambios), { replace: true })

    useEffect(() => {
        const next = search.trim()
        if (next === q) return
        const timer = setTimeout(
            () => setSearchParams((current) => conCambios(current, { q: next }), { replace: true }),
            SEARCH_DELAY_MS,
        )
        return () => clearTimeout(timer)
    }, [search, q, setSearchParams])

    const listado = usePedidosAdmin({ q, estado, canal, limite: PAGE_SIZE, pagina })
    const orders = listado.datos?.datos ?? []
    const total = listado.datos?.meta.total ?? 0
    const pageCount = Math.ceil(total / PAGE_SIZE)
    const firstShown = pagina * PAGE_SIZE + 1

    const clearAll = () => {
        setSearch('')
        setSearchParams({}, { replace: true })
    }

    // Quita solo la búsqueda; los filtros de estado y canal se quedan
    const clearSearch = () => {
        setSearch('')
        change({ q: '' })
    }

    const openOrder = (order) =>
        navigate(adminOrderPath(order.correoCliente, order.numCarrito), { state: backState(location) })

    const searchProblem = problemaDeBusqueda(q)
    const filtered = Boolean(estado || canal)

    return (
        <main className='products'>
            <section className='products-header'>
                <h1>Pedidos</h1>
            </section>

            <input
                type='search'
                className='products-search'
                placeholder='Buscar por nombre o correo del cliente...'
                aria-label='Buscar pedidos por nombre o correo del cliente'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
            />

            <section className='orders-filters'>
                <Select
                    className='products-sort'
                    aria-label='Filtrar por estado'
                    value={estado}
                    onChange={(value) => change({ estado: value })}
                    options={toOptions('Todos los estados', ESTADOS)}
                />
                <Select
                    className='products-sort'
                    aria-label='Filtrar por canal'
                    value={canal}
                    onChange={(value) => change({ canal: value })}
                    options={toOptions('Todos los canales', CANALES)}
                />
                {filtered && (
                    <button type='button' className='products-clear-filters' onClick={() => change({ estado: '', canal: '' })}>
                        Limpiar filtros
                    </button>
                )}
                {search.trim() && (
                    <button type='button' className='products-clear-filters' onClick={clearSearch}>
                        Limpiar búsqueda
                    </button>
                )}
            </section>

            {listado.cargando ? (
                <p className='products-status' role='status'>Cargando pedidos…</p>
            ) : listado.error ? (
                <div className='products-status products-status-error' role='alert'>
                    <p>{listado.error}</p>
                    <button type='button' className='products-status-button' onClick={listado.recargar}>
                        Reintentar
                    </button>
                </div>
            ) : orders.length === 0 ? (
                // Lo escrito no es nombre ni correo: se explica en vez de mostrar «sin coincidencias»
                searchProblem ? (
                    <section className='products-empty'>
                        <h2>{searchProblem}</h2>
                        <p>Busque por el nombre o el correo del cliente, por ejemplo «Ana» o «gmail.com».</p>
                        <button type='button' className='products-button' onClick={clearSearch}>Limpiar búsqueda</button>
                    </section>
                ) : q || filtered || pagina > 0 ? (
                    <section className='products-empty'>
                        <h2>No hay pedidos que coincidan</h2>
                        <p>Pruebe con otra búsqueda o quite algunos filtros.</p>
                        <button type='button' className='products-button' onClick={clearAll}>Limpiar búsqueda y filtros</button>
                    </section>
                ) : (
                    <section className='products-empty'>
                        <h2>Todavía no hay pedidos</h2>
                        <p>Aquí aparecerán los pedidos de la tienda en línea en cuanto se coloque el primero.</p>
                    </section>
                )
            ) : (
                <>
                    <p className='products-count'>
                        {total === 1 ? '1 pedido' : `${total} pedidos · mostrando ${firstShown}–${firstShown + orders.length - 1}`}
                    </p>

                    <div className='product-table-wrapper'>
                        <table className='product-table orders-table'>
                            <thead>
                                <tr>
                                    <th scope='col' className='orders-client'>Cliente</th>
                                    <th scope='col'>Pedido</th>
                                    <th scope='col'>Fecha</th>
                                    <th scope='col'>Productos</th>
                                    <th scope='col'>Canal</th>
                                    <th scope='col' className='product-table-number'>Total</th>
                                    <th scope='col'>Pago</th>
                                    <th scope='col'>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    // Toda la fila abre el detalle; el enlace del número es para el teclado
                                    <tr
                                        key={`${order.correoCliente}/${order.numCarrito}`}
                                        className='orders-row'
                                        onClick={() => openOrder(order)}
                                    >
                                        {/* El número es por cliente: el correo de esta columna es lo que lo distingue */}
                                        <td className='orders-client'>
                                            {order.cliente.nombre}
                                            <span className='orders-secondary orders-email'>{order.correoCliente}</span>
                                            {order.nombreDestinatario && (
                                                <span className='orders-secondary'>Para {order.nombreDestinatario}</span>
                                            )}
                                        </td>
                                        <td>
                                            <Link
                                                className='orders-number codigo'
                                                to={adminOrderPath(order.correoCliente, order.numCarrito)}
                                                state={backState(location)}
                                                aria-label={`Ver el pedido #${order.numCarrito} de ${order.cliente.nombre}`}
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                #{order.numCarrito}
                                            </Link>
                                        </td>
                                        <td className='orders-nowrap'>{dateTimeFormat.format(new Date(order.fecha))}</td>
                                        {/* Se recorta a dos líneas; la lista completa queda en el title y en el detalle */}
                                        <td className='orders-products'>
                                            {order.productos.length > 0 ? (
                                                <span className='orders-products-summary' title={resumenDeProductos(order.productos, Infinity)}>
                                                    {resumenDeProductos(order.productos)}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className='orders-nowrap'>{CANALES[order.canal] ?? order.canal}</td>
                                        <td className='product-table-number'>{priceFormat.format(order.total)}</td>
                                        <td><PaymentStatusChip estadoPago={order.estadoPago} /></td>
                                        <td><OrderStatusChip estado={order.estado} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        alwaysShow
                        className='merchandise-pagination'
                        label='Páginas de pedidos'
                        page={pagina}
                        pageCount={pageCount}
                        onChange={(next) => change({ pagina: next })}
                        summary={total === 1 ? '1 pedido' : `${total} pedidos`}
                    />
                </>
            )}
        </main>
    )
}

export default Orders
