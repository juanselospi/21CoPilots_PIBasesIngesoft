import { useEffect, useId, useState } from 'react'
import './ConfirmDialog.css'

// Dialogo para confirmar una accion antes de hacerla, por ejemplo cerrar sesion.
// `onConfirm` puede ser async, mientras corre los botones quedan deshabilitados y si falla se muestra el error
function ConfirmDialog({ title, message, confirmLabel, busyLabel, onConfirm, onCancel }) {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)
    const titleId = useId()
    const messageId = useId()

    // Con Escape se cancela, menos cuando ya se esta confirmando
    useEffect(() => {
        const cancelOnEscape = (event) => {
            if (event.key === 'Escape' && !busy) onCancel()
        }
        document.addEventListener('keydown', cancelOnEscape)
        return () => document.removeEventListener('keydown', cancelOnEscape)
    }, [busy, onCancel])

    const confirm = async () => {
        setBusy(true)
        setError(null)
        try {
            await onConfirm()
        } catch (confirmError) {
            setError(confirmError.message)
            setBusy(false)
        }
    }

    return (
        <div className='confirm-dialog-overlay' onClick={busy ? undefined : onCancel}>
            <div
                className='confirm-dialog'
                role='alertdialog'
                aria-modal='true'
                aria-labelledby={titleId}
                aria-describedby={messageId}
                onClick={(event) => event.stopPropagation()}
            >
                <h2 id={titleId}>{title}</h2>
                <p id={messageId}>{message}</p>
                {error && <p className='confirm-dialog-error' role='alert'>{error}</p>}

                <div className='confirm-dialog-actions'>
                    {/* El foco arranca en Cancelar para que un Enter no confirme sin querer */}
                    <button type='button' className='confirm-dialog-cancel' onClick={onCancel} disabled={busy} autoFocus>
                        Cancelar
                    </button>
                    <button type='button' className='confirm-dialog-confirm' onClick={confirm} disabled={busy}>
                        {busy ? busyLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDialog
