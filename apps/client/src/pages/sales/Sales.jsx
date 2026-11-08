import { useEffect, useState } from 'react'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
// Mismo aspecto que la página de productos, sus tarjetas, sus campos y los datos del pedido
import '../products/Products.css'
import '../../components/product-form/ProductForm.css'
import '../orders/Orders.css'
import './Sales.css'
import Notice from '../../components/notice/Notice.jsx'
import Pagination from '../../components/pagination/Pagination.jsx'
import ProductFilters from '../../components/product-filters/ProductFilters.jsx'
import { activeFilterTags, emptyFilters, filterParams } from '../../components/product-filters/productFilters.js'
import Select from '../../components/select/Select.jsx'
import { priceFormat } from '../../components/product-card/productFormat.js'
import { listarAlertas } from '../../api/inventario.js'
import { listarModalidades, registrarVenta } from '../../api/pedidos.js'
import { useCategorias } from '../../hooks/useCategorias.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import { avisarCambioDeInventario } from '../../hooks/useAlertasDeInventario.js'
import { useListadoAdministrativo } from '../../hooks/useListadoAdministrativo.js'
import { useRecursoRemoto } from '../../hooks/useRecursoRemoto.js'
import { LIMITE_DIRECCION } from '../../utils/datosDeContacto.js'
import {
    CANALES_DE_VENTA, METODOS_DE_PAGO_DE_VENTA, VENTA_VACIA, agregarALaVenta, avisoDeExistenciasBajas,
    camposDelFormulario, cuerpoDeLaVenta, mensajeDeVenta, reglasDeVenta, subtotalDeLinea, totalDeLaVenta,
} from '../../utils/ventas.js'
import { ConfirmSaleDialog, SaleDetailDialog } from './SaleDialogs.jsx'
import SaleCustomerField from './SaleCustomerField.jsx'
import SaleProductCard from './SaleProductCard.jsx'

// Espera para buscar hasta que el usuario deje de escribir
const SEARCH_DELAY_MS = 300
const PAGE_SIZE = 24

// Lo que sirve para encontrar qué vender; el value es lo que entiende el servidor
const SORT_OPTIONS = [
    { value: 'nombre', label: 'Ordenar: Nombre A–Z' },
    { value: '-nombre', label: 'Ordenar: Nombre Z–A' },
    { value: 'precio', label: 'Ordenar: Precio (menor a mayor)' },
    { value: '-precio', label: 'Ordenar: Precio (mayor a menor)' },
    { value: 'existencias', label: 'Ordenar: Existencias (menor a mayor)' },
]

// Un descontinuado no se puede vender, así que no se ofrece
const AVAILABILITY_OPTIONS = [
    { value: 'en_existencia', label: 'En existencia' },
    { value: 'por_contrapedido', label: 'Admite contrapedido' },
    { value: 'no_disponible', label: 'Agotado' },
]

// Pantalla «Ventas» del panel (HU-09): cada tarjeta agrega a la venta en curso y al final se registra todo junto.
function Sales() {
    const [search, setSearch] = useState('')
    const [q, setQ] = useState('')
    const [page, setPage] = useState(0)
    const [sort, setSort] = useState(SORT_OPTIONS[0].value)
    const [filters, setFilters] = useState(emptyFilters)
    const [showFilters, setShowFilters] = useState(false)
    const [lines, setLines] = useState([])
    const [linesError, setLinesError] = useState(null)
    // Las reglas dependen de estos dos, por eso van aparte y no salen de los valores del formulario
    const [withoutAccount, setWithoutAccount] = useState(false)
    const [delivery, setDelivery] = useState('')
    const [customer, setCustomer] = useState(null)
    const [confirming, setConfirming] = useState(false)
    const [soldOrder, setSoldOrder] = useState(null)
    const [notice, setNotice] = useState(null)
    const [lowStock, setLowStock] = useState(null)

    useEffect(() => {
        const timer = setTimeout(() => {
            setQ(search.trim())
            setPage(0)
        }, SEARCH_DELAY_MS)
        return () => clearTimeout(timer)
    }, [search])

    const listado = useListadoAdministrativo({ q, orden: sort, limite: PAGE_SIZE, pagina: page, ...filterParams(filters) })
    const categorias = useCategorias()
    const categoryNames = categorias.datos?.map(({ nombre }) => nombre) ?? []
    const filterTags = activeFilterTags(filters, priceFormat.format, AVAILABILITY_OPTIONS)
    const modalidades = useRecursoRemoto((signal) => listarModalidades({ signal }), [])
    const products = listado.datos?.datos ?? []
    const productTotal = listado.datos?.meta.total ?? 0

    const selectedDelivery = modalidades.datos?.find(({ modalidad }) => modalidad === delivery)
    const options = { sinCuenta: withoutAccount, exigeDireccion: Boolean(selectedDelivery?.exigeDireccion) }

    const {
        valores: values, errores: errors, formularioRef, cambiarCampo, validar, erroresServidor, reiniciar, atributosCampo, idError,
    } = useFormulario(VENTA_VACIA, reglasDeVenta(options))

    const shipping = selectedDelivery?.costo ?? 0
    const total = totalDeLaVenta(lines, shipping)
    const fieldError = (key) => errors[key] && <p id={idError(key)} className='product-form-error'>{errors[key]}</p>

    // Cualquier cambio de filtros u orden vuelve a la primera página
    const changeFilters = (next) => {
        setFilters(next)
        setPage(0)
    }

    const changeSort = (value) => {
        setSort(value)
        setPage(0)
    }

    const addProduct = (product, quantity) => {
        const result = agregarALaVenta(lines, product, quantity)
        if (result.problema) return result.problema
        setLines(result.lineas)
        setLinesError(null)
        return null
    }

    const selectCustomer = (selected) => {
        setCustomer(selected)
        cambiarCampo('correoCliente', selected?.correo ?? '')
    }

    const selectDelivery = (modalidad) => {
        cambiarCampo('modalidadEntrega', modalidad)
        setDelivery(modalidad)
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        // Primero lo de las líneas: así salen todos los errores a la vez
        const missingLines = lines.length === 0
        setLinesError(missingLines ? 'Agregue al menos un producto.' : null)
        if (validar() && !missingLines) setConfirming(true)
    }

    const warnLowStock = async (sold) => {
        try {
            const { datos } = await listarAlertas()
            setLowStock(avisoDeExistenciasBajas(sold, datos))
        } catch {
            // El aviso es un extra: la venta ya quedó y el menú de alertas se actualiza aparte
        }
    }

    const confirmSale = async () => {
        let order
        try {
            order = await registrarVenta(cuerpoDeLaVenta(values, lines, options))
        } catch (error) {
            listado.recargar()
            const fields = camposDelFormulario(error.detalles?.campos)
            if (fields.length === 0) throw error
            // El problema es de un campo: se cierra para que se vea marcado en el formulario
            setConfirming(false)
            erroresServidor(fields, error.message)
            return
        }

        setNotice({ key: Date.now(), text: mensajeDeVenta(lines) })
        setLowStock(null)
        warnLowStock(lines)
        setSoldOrder(order)
        setConfirming(false)
        setLines([])
        setCustomer(null)
        setDelivery('')
        reiniciar(VENTA_VACIA)
        listado.recargar()
        avisarCambioDeInventario()
        window.scrollTo(0, 0)
    }

    const customerName = withoutAccount ? values.nombre.trim() : customer?.nombre

    return (
        <main className='products'>
            <section className='products-header'>
                <h1>Registrar venta</h1>
            </section>

            {notice && <Notice key={notice.key} type='success' onClose={() => setNotice(null)}>{notice.text}</Notice>}
            {lowStock && <Notice type='warning' onClose={() => setLowStock(null)}>{lowStock}</Notice>}

            <div className='sales-layout'>
                <section className='sales-products' aria-label='Productos'>
                    <input
                        type='search'
                        className='products-search'
                        placeholder='Buscar por código o nombre...'
                        aria-label='Buscar productos por código o nombre'
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />

                    <div className='products-toolbar sales-toolbar'>
                        <button
                            type='button'
                            className='products-button'
                            aria-expanded={showFilters}
                            aria-controls='sales-filters'
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal size={20} aria-hidden='true' />
                            Filtros{filterTags.length > 0 && ` (${filterTags.length})`}
                            <ChevronDown size={16} className='products-button-chevron' aria-hidden='true' />
                        </button>
                        <Select
                            className='products-sort'
                            aria-label='Ordenar productos'
                            value={sort}
                            onChange={changeSort}
                            options={SORT_OPTIONS}
                        />
                    </div>

                    {/* Siempre montado para animar la apertura y el cierre; se despliega con `open` */}
                    <ProductFilters
                        id='sales-filters'
                        open={showFilters}
                        filters={filters}
                        categories={categoryNames}
                        availabilityOptions={AVAILABILITY_OPTIONS}
                        showFlags={false}
                        onApply={(next) => {
                            changeFilters(next)
                            setShowFilters(false)
                        }}
                        onClose={() => setShowFilters(false)}
                    />

                    {filterTags.length > 0 && (
                        <div className='products-active-filters'>
                            {filterTags.map(({ key, label }) => (
                                <span key={key} className='products-filter-tag'>
                                    {label}
                                    <button
                                        type='button'
                                        aria-label={`Quitar filtro ${label}`}
                                        onClick={() => changeFilters({ ...filters, [key]: emptyFilters[key] })}
                                    >
                                        <X size={16} aria-hidden='true' />
                                    </button>
                                </span>
                            ))}
                            <button type='button' className='products-clear-filters' onClick={() => changeFilters(emptyFilters)}>Limpiar filtros</button>
                        </div>
                    )}

                    {listado.cargando ? (
                        <p className='products-status' role='status'>Cargando productos…</p>
                    ) : listado.error ? (
                        <div className='products-status products-status-error' role='alert'>
                            <p>{listado.error}</p>
                            <button type='button' className='products-status-button' onClick={listado.recargar}>Reintentar</button>
                        </div>
                    ) : products.length === 0 ? (
                        <p className='products-status' role='status'>Ningún producto coincide con la búsqueda o los filtros.</p>
                    ) : (
                        <>
                            <div className='sales-grid'>
                                {products.map((product) => (
                                    <SaleProductCard
                                        key={product.sku}
                                        product={product}
                                        inSale={lines.find(({ sku }) => sku === product.sku)?.cantidad ?? 0}
                                        onAdd={addProduct}
                                    />
                                ))}
                            </div>
                            <Pagination
                                label='Páginas de productos'
                                page={page}
                                pageCount={Math.ceil(productTotal / PAGE_SIZE)}
                                onChange={setPage}
                                summary={productTotal === 1 ? '1 producto' : `${productTotal} productos`}
                            />
                        </>
                    )}
                </section>

                <form ref={formularioRef} className='order-card sales-summary' onSubmit={handleSubmit} noValidate>
                    <h2>Venta en curso</h2>

                    {lines.length === 0 ? (
                        <p className='orders-secondary'>Agregue productos desde las tarjetas.</p>
                    ) : (
                        <ul className='sales-lines'>
                            {lines.map((line) => (
                                <li key={line.sku}>
                                    <span className='sales-line-name'>{line.nombre}</span>
                                    <span className='orders-secondary sales-number'>× {line.cantidad}</span>
                                    <span className='sales-number'>{priceFormat.format(subtotalDeLinea(line))}</span>
                                    <button
                                        type='button'
                                        className='sales-line-remove'
                                        aria-label={`Quitar ${line.nombre} de la venta`}
                                        onClick={() => setLines((current) => current.filter(({ sku }) => sku !== line.sku))}
                                    >
                                        <X size={16} aria-hidden='true' />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {linesError && <p className='product-form-error' role='alert'>{linesError}</p>}

                    <fieldset className='sales-customer-type'>
                        <legend>¿A quién se le vende?</legend>
                        <label>
                            <input type='radio' className='casilla' name='tipoCliente' checked={!withoutAccount} onChange={() => setWithoutAccount(false)} />
                            Cliente registrado
                        </label>
                        <label>
                            <input type='radio' className='casilla' name='tipoCliente' checked={withoutAccount} onChange={() => setWithoutAccount(true)} />
                            Sin cuenta
                        </label>
                    </fieldset>

                    {withoutAccount ? (
                        <>
                            <label className='product-form-field'>
                                <span>Nombre</span>
                                <div className='product-form-input'>
                                    <input
                                        type='text'
                                        maxLength={150}
                                        {...atributosCampo('nombre')}
                                        value={values.nombre}
                                        onChange={(event) => cambiarCampo('nombre', event.target.value)}
                                    />
                                </div>
                                {fieldError('nombre')}
                            </label>
                            <label className='product-form-field'>
                                <span>Teléfono<small className='product-form-optional'> (opcional)</small></span>
                                <div className='product-form-input'>
                                    <input
                                        type='tel'
                                        placeholder='8888-8888'
                                        {...atributosCampo('telefono')}
                                        value={values.telefono}
                                        onChange={(event) => cambiarCampo('telefono', event.target.value)}
                                    />
                                </div>
                                {fieldError('telefono')}
                            </label>
                        </>
                    ) : (
                        <SaleCustomerField
                            selected={customer}
                            onSelect={selectCustomer}
                            attributes={atributosCampo('correoCliente')}
                            error={errors.correoCliente}
                            errorId={idError('correoCliente')}
                        />
                    )}

                    <label className='product-form-field'>
                        <span>Canal</span>
                        <div className='product-form-input'>
                            <Select
                                {...atributosCampo('canal')}
                                value={values.canal}
                                onChange={(value) => cambiarCampo('canal', value)}
                                options={[{ value: '', label: 'Seleccione un canal' }, ...CANALES_DE_VENTA]}
                            />
                        </div>
                        {fieldError('canal')}
                    </label>

                    <label className='product-form-field'>
                        <span>Modalidad de entrega</span>
                        <div className='product-form-input'>
                            <Select
                                {...atributosCampo('modalidadEntrega')}
                                value={values.modalidadEntrega}
                                onChange={selectDelivery}
                                options={[
                                    { value: '', label: 'Seleccione una modalidad' },
                                    ...(modalidades.datos ?? []).map(({ modalidad, nombre, costo }) => ({
                                        value: modalidad,
                                        label: `${nombre} · ${priceFormat.format(costo)}`,
                                    })),
                                ]}
                            />
                        </div>
                        {fieldError('modalidadEntrega')}
                        {modalidades.error && <p className='product-form-error' role='alert'>{modalidades.error}</p>}
                    </label>

                    {selectedDelivery?.exigeDireccion && (
                        <label className='product-form-field'>
                            <span>Dirección de entrega</span>
                            <div className='product-form-input'>
                                <textarea
                                    rows={2}
                                    maxLength={LIMITE_DIRECCION}
                                    {...atributosCampo('direccion')}
                                    value={values.direccion}
                                    onChange={(event) => cambiarCampo('direccion', event.target.value)}
                                />
                            </div>
                            {fieldError('direccion')}
                        </label>
                    )}

                    <label className='product-form-field'>
                        <span>Método de pago</span>
                        <div className='product-form-input'>
                            <Select
                                {...atributosCampo('metodoPago')}
                                value={values.metodoPago}
                                onChange={(value) => cambiarCampo('metodoPago', value)}
                                options={[{ value: '', label: 'Seleccione un método' }, ...METODOS_DE_PAGO_DE_VENTA]}
                            />
                        </div>
                        {fieldError('metodoPago')}
                    </label>

                    <dl className='order-totals sales-totals'>
                        <dt>Envío</dt>
                        <dd>{priceFormat.format(shipping)}</dd>
                        <dt className='order-total'>Total</dt>
                        <dd className='order-total'>{priceFormat.format(total)}</dd>
                    </dl>

                    <button type='submit' className='products-button products-button-primary'>Registrar venta</button>
                </form>
            </div>

            {confirming && (
                <ConfirmSaleDialog
                    lines={lines}
                    customerName={customerName}
                    channel={values.canal}
                    shipping={shipping}
                    total={total}
                    onConfirm={confirmSale}
                    onCancel={() => setConfirming(false)}
                />
            )}

            {soldOrder && <SaleDetailDialog order={soldOrder} onClose={() => setSoldOrder(null)} />}
        </main>
    )
}

export default Sales
