import { useEffect, useState } from 'react'
import { useBuscarClientes } from '../../hooks/useBuscarClientes.js'

// Espera para buscar hasta que el usuario deje de escribir
const SEARCH_DELAY_MS = 300

// Buscador del cliente registrado, por nombre, correo o cédula; ya elegido se muestra con «Cambiar».
function SaleCustomerField({ selected, onSelect, attributes, error, errorId }) {
    const [search, setSearch] = useState('')
    const [q, setQ] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => setQ(search.trim()), SEARCH_DELAY_MS)
        return () => clearTimeout(timer)
    }, [search])

    const busqueda = useBuscarClientes(q)
    const customers = busqueda.datos ?? []

    const choose = (customer) => {
        onSelect(customer)
        setSearch('')
        setQ('')
    }

    if (selected) {
        return (
            <div className='sales-customer-selected'>
                <span>
                    <strong>{selected.nombre}</strong>
                    <span className='orders-secondary'>{selected.correo} · {selected.cedula}</span>
                </span>
                <button type='button' className='products-button' onClick={() => onSelect(null)}>Cambiar</button>
            </div>
        )
    }

    return (
        <label className='product-form-field'>
            <span>Cliente</span>
            <div className='product-form-input'>
                <input
                    type='search'
                    placeholder='Buscar por nombre, correo o cédula...'
                    autoComplete='off'
                    {...attributes}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </div>
            {error && <p id={errorId} className='product-form-error'>{error}</p>}
            {q.length >= 2 && (
                busqueda.cargando ? (
                    <p className='orders-secondary' role='status'>Buscando clientes…</p>
                ) : busqueda.error ? (
                    <p className='product-form-error' role='alert'>{busqueda.error}</p>
                ) : customers.length === 0 ? (
                    <p className='orders-secondary' role='status'>Ningún cliente coincide con la búsqueda.</p>
                ) : (
                    <ul className='sales-customer-results'>
                        {customers.map((customer) => (
                            <li key={customer.correo}>
                                <button type='button' onClick={() => choose(customer)}>
                                    <strong>{customer.nombre}</strong>
                                    <span className='orders-secondary'>{customer.correo} · {customer.cedula}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )
            )}
        </label>
    )
}

export default SaleCustomerField
