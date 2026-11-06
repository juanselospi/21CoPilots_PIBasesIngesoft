import { useSearchParams } from 'react-router'
import '../../components/product-table/ProductTable.css'
// La paginación, como el historial de Mercancía
import '../merchandise/Merchandise.css'
import DateField from '../../components/date-field/DateField.jsx'
import Pagination from '../../components/pagination/Pagination.jsx'
import Select from '../../components/select/Select.jsx'
import { dateTimeFormat } from '../merchandise/merchandiseFormat.js'
import { useBitacora } from '../../hooks/useBitacora.js'
import { EVENTOS, cambioDeFecha, detalleDelValor, leerConsultaDeBitacora, nombreDeEntidad } from '../../utils/bitacora.js'
import { conCambios } from '../../utils/pedidosAdmin.js'

const PAGE_SIZE = 25

const eventOptions = [
    { value: '', label: 'Todos los eventos' },
    ...Object.entries(EVENTOS).map(([value, label]) => ({ value, label })),
]

// El valor anterior o nuevo de un registro, campo por campo
function ValueDetail({ value }) {
    const rows = detalleDelValor(value)
    if (rows.length === 0) return '—'
    return (
        <ul className='settings-values'>
            {rows.map(({ etiqueta, texto }) => <li key={etiqueta}><span>{etiqueta}:</span> {texto}</li>)}
        </ul>
    )
}

// Pestaña «Bitácora» de Configuración (RF-52): quién cambió qué, con filtros por evento y fechas.
function AuditLog() {
    const [searchParams, setSearchParams] = useSearchParams()
    const { evento, desde, hasta, pagina } = leerConsultaDeBitacora(searchParams)

    const change = (cambios) => setSearchParams((current) => conCambios(current, cambios), { replace: true })

    const bitacora = useBitacora({ evento, desde, hasta, limite: PAGE_SIZE, pagina })
    const records = bitacora.datos?.datos ?? []
    const total = bitacora.datos?.meta.total ?? 0
    const filtered = Boolean(evento || desde || hasta)
    const clearFilters = () => change({ evento: '', desde: '', hasta: '' })

    return (
        <section className='settings-section'>
            <div className='settings-section-header'>
                <div>
                    <h2>Bitácora</h2>
                    <p>Quién cambió precios, pedidos, existencias o cuentas, y qué valores tenían antes y después.</p>
                </div>
            </div>

            <div className='settings-filters'>
                <label>
                    <span>Evento</span>
                    <Select className='products-sort' value={evento} onChange={(value) => change({ evento: value })} options={eventOptions} />
                </label>
                <label>
                    <span>Desde</span>
                    <DateField
                        className='products-sort'
                        label='Desde'
                        value={desde}
                        onChange={(value) => change(cambioDeFecha({ desde, hasta }, 'desde', value))}
                    />
                </label>
                <label>
                    <span>Hasta</span>
                    <DateField
                        className='products-sort'
                        label='Hasta'
                        value={hasta}
                        onChange={(value) => change(cambioDeFecha({ desde, hasta }, 'hasta', value))}
                    />
                </label>
                {filtered && (
                    <button type='button' className='products-clear-filters' onClick={clearFilters}>Limpiar filtros</button>
                )}
            </div>

            {bitacora.cargando ? (
                <p className='products-status' role='status'>Cargando bitácora…</p>
            ) : bitacora.error ? (
                <div className='products-status products-status-error' role='alert'>
                    <p>{bitacora.error}</p>
                    <button type='button' className='products-status-button' onClick={bitacora.recargar}>
                        Reintentar
                    </button>
                </div>
            ) : records.length === 0 ? (
                filtered || pagina > 0 ? (
                    <section className='products-empty'>
                        <h2>No hay registros que coincidan</h2>
                        <p>Pruebe con otro evento u otras fechas.</p>
                        <button type='button' className='products-button' onClick={clearFilters}>Limpiar filtros</button>
                    </section>
                ) : (
                    <section className='products-empty'>
                        <h2>Todavía no hay registros</h2>
                        <p>Aquí aparecerá cada cambio en cuanto alguien haga el primero.</p>
                    </section>
                )
            ) : (
                <>
                    <div className='product-table-wrapper'>
                        <table className='product-table'>
                            <thead>
                                <tr>
                                    <th scope='col'>Fecha</th>
                                    <th scope='col'>Usuario</th>
                                    <th scope='col'>Evento</th>
                                    <th scope='col'>Entidad</th>
                                    <th scope='col'>Antes</th>
                                    <th scope='col'>Después</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record, index) => (
                                    <tr key={`${record.fecha}-${record.usuario}-${index}`}>
                                        <td className='settings-nowrap'>{dateTimeFormat.format(new Date(record.fecha))}</td>
                                        <td>
                                            {record.nombreUsuario ?? record.usuario}
                                            {record.nombreUsuario && <span className='settings-secondary'>{record.usuario}</span>}
                                        </td>
                                        <td>{EVENTOS[record.evento] ?? record.evento}</td>
                                        <td>
                                            {record.entidad ? nombreDeEntidad(record.entidad) : '—'}
                                            {record.entidadId && <span className='settings-secondary settings-id'>{record.entidadId}</span>}
                                        </td>
                                        <td><ValueDetail value={record.valorAnterior} /></td>
                                        <td><ValueDetail value={record.valorNuevo} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        alwaysShow
                        className='merchandise-pagination'
                        label='Páginas de la bitácora'
                        page={pagina}
                        pageCount={Math.ceil(total / PAGE_SIZE)}
                        onChange={(next) => change({ pagina: next })}
                        summary={total === 1 ? '1 registro' : `${total} registros`}
                    />
                </>
            )}
        </section>
    )
}

export default AuditLog
