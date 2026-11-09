import { useId, useState } from 'react'
import { Lock } from 'lucide-react'
import ConfirmDialog from '../../components/confirm-dialog/ConfirmDialog.jsx'
import Notice from '../../components/notice/Notice.jsx'
import QuantityStepper from '../../components/quantity-stepper/QuantityStepper.jsx'
import { priceFormat } from '../../components/product-card/productFormat.js'
import {
    agregarLineaAlPedido, cambiarCantidadDeLinea, quitarLineaDelPedido, reemplazarLineaDelPedido,
} from '../../api/pedidos.js'
import { aCantidad } from '../../utils/carrito.js'
import { creditoNuevo, estaPagado, motivoSinEdicion, precioPagado } from '../../utils/pedidosAdmin.js'
import OrderProductPicker from './OrderProductPicker.jsx'
import ModalPresence from '../../components/modal-presence/ModalPresence.jsx'

// Productos del pedido y su edición (HU-17). Si el estado no la permite, los controles quedan
// bloqueados con el motivo. `onEdit` hace el cambio y devuelve el pedido como quedó.
function OrderLines({ order, busy, onEdit }) {
    const [notice, setNotice] = useState(null)
    const [removing, setRemoving] = useState(null)
    const [replacing, setReplacing] = useState(null)
    const [adding, setAdding] = useState(false)
    const reasonId = useId()

    const { correoCliente: correo, numCarrito, lineasEditables: editable } = order
    const paid = estaPagado(order)
    const blockedBy = editable ? undefined : motivoSinEdicion(order.estado)

    const edit = async (request, message) => {
        setNotice(null)
        const next = await onEdit(request)
        const credit = creditoNuevo(order, next)
        setNotice({
            key: Date.now(),
            text: credit > 0 ? `${message} Quedó un crédito a favor del cliente de ${priceFormat.format(credit)}.` : message,
        })
    }

    const changeQuantity = ({ sku, nombre }, cantidad) =>
        edit(() => cambiarCantidadDeLinea(correo, numCarrito, sku, cantidad), `Cantidad de ${nombre} actualizada a ${cantidad}.`)

    const confirmRemove = async () => {
        const { sku, nombre } = removing
        await edit(() => quitarLineaDelPedido(correo, numCarrito, sku), `Se quitó ${nombre} del pedido.`)
        setRemoving(null)
    }

    const confirmAdd = async ({ sku, nombre, cantidad }) => {
        await edit(() => agregarLineaAlPedido(correo, numCarrito, { sku, cantidad }), `Se agregó ${nombre} al pedido.`)
        setAdding(false)
    }

    const confirmReplace = async ({ sku, nombre }) => {
        await edit(() => reemplazarLineaDelPedido(correo, numCarrito, replacing.sku, sku), `${replacing.nombre} se reemplazó por ${nombre}.`)
        setReplacing(null)
    }

    return (
        <>
            <div className='order-lines-header'>
                <h2>Productos</h2>
                <button
                    type='button'
                    className='products-button'
                    disabled={!editable || busy}
                    title={blockedBy}
                    aria-describedby={editable ? undefined : reasonId}
                    onClick={() => setAdding(true)}
                >
                    Agregar producto
                </button>
            </div>

            {!editable && (
                <p id={reasonId} className='order-lines-blocked'>
                    <Lock size={16} aria-hidden='true' />
                    {blockedBy}
                </p>
            )}
            {editable && paid && (
                <p className='orders-secondary'>
                    Pedido pagado: lo que se quite queda como crédito a favor del cliente y lo que se agregue no se cobra desde aquí.
                </p>
            )}
            {notice && (
                <Notice key={notice.key} type='success' onClose={() => setNotice(null)}>{notice.text}</Notice>
            )}

            <div className='product-table-wrapper'>
                <table className='product-table'>
                    <thead>
                        <tr>
                            <th scope='col'>Código</th>
                            <th scope='col'>Producto</th>
                            <th scope='col' className='product-table-number'>Cantidad</th>
                            <th scope='col' className='product-table-number'>Precio</th>
                            <th scope='col' className='product-table-number'>Subtotal</th>
                            <th scope='col' className='product-table-number'>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.lineas.map((line) => (
                            // Con la key el campo vuelve a la cantidad guardada cuando esta cambia
                            <OrderLine
                                key={`${line.sku}-${line.cantidad}`}
                                line={line}
                                busy={busy}
                                blockedBy={blockedBy}
                                reasonId={editable ? undefined : reasonId}
                                onSave={changeQuantity}
                                onRemove={setRemoving}
                                onReplace={setReplacing}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <ModalPresence>
                {removing && (
                    <ConfirmDialog
                        title={`¿Quitar ${removing.nombre}?`}
                        message={`${removing.cantidad === 1 ? 'La unidad vuelve' : `Las ${removing.cantidad} unidades vuelven`} al inventario${
                            paid ? ' y lo cobrado queda como crédito a favor del cliente' : ''
                        }.`}
                        confirmLabel='Quitar'
                        busyLabel='Quitando…'
                        cancelLabel='Volver'
                        onConfirm={confirmRemove}
                        onCancel={() => setRemoving(null)}
                    />
                )}
            </ModalPresence>

            <ModalPresence>
                {adding && (
                    <OrderProductPicker
                        title='Agregar producto'
                        description='El producto entra al pedido con el precio de hoy.'
                        lines={order.lineas}
                        askQuantity
                        confirmLabel='Agregar'
                        busyLabel='Agregando…'
                        onConfirm={confirmAdd}
                        onCancel={() => setAdding(false)}
                    />
                )}
            </ModalPresence>

            <ModalPresence>
                {replacing && (
                    <OrderProductPicker
                        title={`Reemplazar ${replacing.nombre}`}
                        description={`Se pagó ${priceFormat.format(precioPagado(replacing))} por unidad, con impuesto: solo aparecen productos de ese precio o menos. La línea conserva el precio pagado y ${replacing.cantidad === 1 ? 'su unidad' : `sus ${replacing.cantidad} unidades`}; no se cobra ni se devuelve la diferencia.`}
                        lines={order.lineas}
                        maxPrice={precioPagado(replacing)}
                        confirmLabel='Reemplazar'
                        busyLabel='Reemplazando…'
                        onConfirm={confirmReplace}
                        onCancel={() => setReplacing(null)}
                    />
                )}
            </ModalPresence>
        </>
    )
}

// Una línea con sus controles. La cantidad se guarda con un botón y no al tocar el selector: en un
// pedido pagado, bajarla deja un crédito que volver a subirla no deshace.
function OrderLine({ line, busy, blockedBy, reasonId, onSave, onRemove, onReplace }) {
    const [draft, setDraft] = useState(String(line.cantidad))
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const errorId = useId()

    const blocked = Boolean(blockedBy)
    const quantity = aCantidad(draft)
    const changed = quantity !== line.cantidad

    const changeDraft = (value) => {
        setDraft(value)
        setError(null)
    }

    const save = async () => {
        setSaving(true)
        setError(null)
        try {
            await onSave(line, quantity)
        } catch (saveError) {
            setError(saveError.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <tr>
                <td className='product-table-sku codigo'>{line.sku}</td>
                <td>{line.nombre}</td>
                <td className='product-table-number order-line-quantity'>
                    <QuantityStepper
                        // Bloqueada muestra lo guardado, no lo que se estaba por cambiar
                        value={blocked ? String(line.cantidad) : draft}
                        onType={changeDraft}
                        onStep={(next) => changeDraft(String(next))}
                        onDone={() => setDraft(String(quantity))}
                        disabled={blocked}
                        busy={busy}
                        inputAttributes={{
                            'aria-label': `Cantidad de ${line.nombre}`,
                            'aria-invalid': error ? true : undefined,
                            'aria-describedby': error ? errorId : reasonId,
                        }}
                    />
                </td>
                <td className='product-table-number'>{priceFormat.format(line.precioUnitario)}</td>
                <td className='product-table-number'>{priceFormat.format(line.subtotal)}</td>
                <td className='product-table-number'>
                    <div className='order-line-actions'>
                        {changed && !blocked ? (
                            <>
                                <button type='button' className='products-button products-button-primary' disabled={busy} onClick={save}>
                                    {saving ? 'Guardando…' : 'Guardar'}
                                </button>
                                <button type='button' className='products-button' disabled={busy} onClick={() => changeDraft(String(line.cantidad))}>
                                    Descartar
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type='button'
                                    className='products-button'
                                    disabled={blocked || busy}
                                    title={blockedBy}
                                    aria-label={`Reemplazar ${line.nombre}`}
                                    aria-describedby={reasonId}
                                    onClick={() => onReplace(line)}
                                >
                                    Reemplazar
                                </button>
                                <button
                                    type='button'
                                    className='products-button order-button-cancel'
                                    disabled={blocked || busy}
                                    title={blockedBy}
                                    aria-label={`Quitar ${line.nombre}`}
                                    aria-describedby={reasonId}
                                    onClick={() => onRemove(line)}
                                >
                                    Quitar
                                </button>
                            </>
                        )}
                    </div>
                </td>
            </tr>
            {error && (
                <tr className='order-line-error-row'>
                    <td colSpan={6}>
                        <p id={errorId} className='order-line-error' role='alert'>{error}</p>
                    </td>
                </tr>
            )}
        </>
    )
}

export default OrderLines
