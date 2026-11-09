import { useId, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { obtenerMisCreditos } from '../../api/clientes.js'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { useRecursoRemoto } from '../../hooks/useRecursoRemoto.js'
import { backState, myOrderPath } from '../../routes.js'
import { movimientoDeCredito } from '../../utils/creditos.js'

const dateFormat = new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' })

// Saldo a favor del cliente y de donde salio. Tiene su propia carga,
// asi si falla solo sale el error aqui y el resto de la pagina sigue igual
function CreditSection({ email }) {
    const creditos = useRecursoRemoto((signal) => obtenerMisCreditos({ signal }), [email])
    const [open, setOpen] = useState(false)
    const location = useLocation()
    const listId = useId()

    if (creditos.cargando) {
        return <p className='my-account-card my-account-status' role='status'>Cargando tu saldo a favor…</p>
    }

    if (creditos.error) {
        return (
            <div className='my-account-card my-account-status my-account-status-error' role='alert'>
                <p>{creditos.error}</p>
                <button type='button' className='my-account-save' onClick={creditos.recargar}>
                    Reintentar
                </button>
            </div>
        )
    }

    const { saldo, movimientos } = creditos.datos

    return (
        <section className='my-account-card' aria-label='Saldo a favor'>
            <div className='my-account-credit'>
                <div>
                    <strong>Saldo a favor</strong>
                    <p>
                        {saldo > 0
                            ? 'Se usa al pagar tu próxima compra. No se puede retirar en efectivo.'
                            : 'No tienes saldo a favor.'}
                    </p>
                </div>
                <span className='my-account-credit-amount'>{priceFormat.format(saldo)}</span>
            </div>

            {movimientos.length > 0 && (
                <>
                    <button
                        type='button'
                        className='my-account-section-toggle my-account-credit-toggle'
                        aria-expanded={open}
                        aria-controls={open ? listId : undefined}
                        onClick={() => setOpen((abierto) => !abierto)}
                    >
                        Movimientos
                        {open ? <ChevronUp size={20} aria-hidden='true' /> : <ChevronDown size={20} aria-hidden='true' />}
                    </button>

                    {open && (
                        <ul id={listId} className='my-account-credit-list'>
                            {movimientos.map((movimiento) => {
                                const { etiqueta, signo, motivo, numCarrito } = movimientoDeCredito(movimiento)
                                return (
                                    <li key={`${movimiento.tipo}-${movimiento.fecha}`}>
                                        <div>
                                            <strong>{etiqueta}</strong>
                                            <span>{dateFormat.format(new Date(movimiento.fecha))}</span>
                                            <span>{motivo}</span>
                                            {numCarrito !== null && (
                                                <Link to={myOrderPath(numCarrito)} state={backState(location)} className='my-account-credit-order'>
                                                    Ver pedido n.º {numCarrito}
                                                </Link>
                                            )}
                                        </div>
                                        <span className='my-account-credit-movement'>
                                            {signo}{priceFormat.format(movimiento.monto)}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </>
            )}
        </section>
    )
}

export default CreditSection
