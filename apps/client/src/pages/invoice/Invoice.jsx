import { useParams } from 'react-router'
import './Invoice.css'
import BackButton from '../../components/back-button/BackButton.jsx'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { obtenerFactura } from '../../api/pedidos.js'
import { useRecursoRemoto } from '../../hooks/useRecursoRemoto.js'
import { nombreDelMetodo } from '../../utils/checkout.js'

const dateFormat = new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short' })

// Factura de un pedido del cliente, con los montos de lo que se cobro y no los precios de hoy.
// Si el pedido no es suyo o todavia no tiene factura el servidor responde 404 y sale su mensaje
function Invoice() {
    const { numCarrito } = useParams()
    const factura = useRecursoRemoto((signal) => obtenerFactura(numCarrito, { signal }), [numCarrito])

    return (
        <main className='invoice'>
            <div className='invoice-back'>
                <BackButton fallback='/' label='Volver' />
            </div>

            {factura.cargando && <p className='invoice-card invoice-status' role='status'>Cargando la factura…</p>}

            {factura.error && (
                <div className='invoice-card invoice-status invoice-status-error' role='alert'>
                    <p>{factura.error}</p>
                    <button type='button' className='invoice-retry' onClick={factura.recargar}>Reintentar</button>
                </div>
            )}

            {factura.datos && <InvoiceDetail numCarrito={numCarrito} factura={factura.datos} />}
        </main>
    )
}

function InvoiceDetail({ numCarrito, factura }) {
    const { emisor, receptor } = factura

    return (
        <article className='invoice-card invoice-detail'>
            <header className='invoice-header'>
                <div>
                    <h1>Factura</h1>
                    <p>Pedido n.º {numCarrito}</p>
                </div>
                <dl className='invoice-data'>
                    <div>
                        <dt>Número</dt>
                        <dd className='codigo'>{factura.numFactura}</dd>
                    </div>
                    <div>
                        <dt>Fecha</dt>
                        <dd>{dateFormat.format(new Date(factura.fecha))}</dd>
                    </div>
                </dl>
            </header>

            <div className='invoice-parties'>
                <section>
                    <h2>Emisor</h2>
                    <p>{emisor?.razonSocial}</p>
                    <p>Cédula jurídica: {emisor?.cedulaJuridica}</p>
                    <p>{emisor?.direccion}</p>
                </section>
                <section>
                    <h2>Cliente</h2>
                    <p>{receptor.nombre}</p>
                    <p>Cédula: {receptor.cedula}</p>
                </section>
            </div>

            {/* En celular la tabla se desplaza sola y no estira la pagina */}
            <div className='invoice-table-wrapper'>
                <table className='invoice-table'>
                    <thead>
                        <tr>
                            <th scope='col'>Producto</th>
                            <th scope='col'>Cantidad</th>
                            <th scope='col'>Precio sin impuesto</th>
                            <th scope='col'>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {factura.lineas.map((linea) => (
                            <tr key={linea.sku}>
                                <td>{linea.nombre}</td>
                                <td>{linea.cantidad}</td>
                                <td>{priceFormat.format(linea.precioUnitario)}</td>
                                <td>{priceFormat.format(linea.subtotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <dl className='invoice-totals'>
                <div>
                    <dt>Subtotal</dt>
                    <dd>{priceFormat.format(factura.subtotal)}</dd>
                </div>
                <div>
                    <dt>Impuesto</dt>
                    <dd>{priceFormat.format(factura.impuesto)}</dd>
                </div>
                <div>
                    <dt>Envío</dt>
                    <dd>{priceFormat.format(factura.envio)}</dd>
                </div>
                <div className='invoice-total'>
                    <dt>Total</dt>
                    <dd>{priceFormat.format(factura.total)}</dd>
                </div>
            </dl>

            <p className='invoice-payment'>
                Pagado con {nombreDelMetodo(factura.metodoPago)}. Referencia: <span className='codigo'>{factura.numReferencia}</span>
            </p>
        </article>
    )
}

export default Invoice
