import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import './ProductForm.css'

// Texto del diálogo para cada acción
const textByAction = {
    desactivar: {
        title: 'Desactivar producto',
        message: 'Deja de verse en la tienda, pero conserva sus ventas y movimientos. Se puede reactivar después.',
        confirm: 'Desactivar',
    },
    reactivar: {
        title: 'Reactivar producto',
        message: 'Vuelve a verse en la tienda si tiene existencias o admite contrapedido.',
        confirm: 'Reactivar',
    },
    eliminar: {
        title: 'Eliminar producto',
        message: 'Se borra para siempre. Si tiene ventas o movimientos no se puede eliminar; en ese caso, desactívelo.',
        confirm: 'Eliminar',
        danger: true,
    },
}

// Confirmación de desactivar, reactivar o eliminar un producto. No llama a la API:
// usa onConfirm(action, product), que devuelve {} si salió bien o { error, withHistory } si no.
// Si no se puede eliminar porque tiene historial, ofrece desactivarlo.
function ProductActionDialog({ action, product, onClose, onConfirm }) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [offerDeactivate, setOfferDeactivate] = useState(false)
    const { title, message, confirm, danger } = textByAction[action]

    // No se cierra mientras guarda
    const close = () => {
        if (!saving) onClose()
    }

    useEffect(() => {
        const closeOnEscape = (event) => event.key === 'Escape' && !saving && onClose()
        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
    }, [saving, onClose])

    // Si salió bien, quien abrió el diálogo lo cierra
    const run = async (chosen) => {
        setSaving(true)
        setError(null)
        setOfferDeactivate(false)
        const result = await onConfirm(chosen, product)
        setSaving(false)

        if (result.error) {
            setError(result.error)
            setOfferDeactivate(result.withHistory && !product.discontinued)
        }
    }

    return (
        <div className='product-form-overlay' onClick={close}>
            <div
                className='product-form-modal'
                role='alertdialog'
                aria-modal='true'
                aria-labelledby='product-action-title'
                aria-describedby='product-action-message'
                onClick={(event) => event.stopPropagation()}
            >
                <header className='product-form-header'>
                    <div>
                        <h2 id='product-action-title'>{title}</h2>
                        <p>{product.sku} · {product.name}</p>
                    </div>
                    <button type='button' className='product-form-close' aria-label='Cerrar' disabled={saving} onClick={close}>
                        <X size={20} />
                    </button>
                </header>

                <p id='product-action-message' className='product-form-message'>{message}</p>

                {error && <p className='product-form-alert' role='alert'>{error}</p>}

                <footer className='product-form-actions'>
                    <button type='button' className='product-form-button' disabled={saving} onClick={close}>
                        Cancelar
                    </button>
                    {offerDeactivate ? (
                        <button
                            type='button'
                            className='product-form-button product-form-button-primary'
                            disabled={saving}
                            onClick={() => run('desactivar')}
                        >
                            {saving ? 'Desactivando…' : 'Desactivar en su lugar'}
                        </button>
                    ) : (
                        <button
                            type='button'
                            className={`product-form-button ${danger ? 'product-form-button-danger' : 'product-form-button-primary'}`}
                            disabled={saving}
                            onClick={() => run(action)}
                        >
                            {saving ? 'Guardando…' : confirm}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    )
}

export default ProductActionDialog
