import { useEffect, useState } from 'react'
import './ModalPresence.css'

// Por si la animación no llega a avisar (pestaña en segundo plano); es un poco más que la salida del CSS
const EXIT_FALLBACK_MS = 300

// Deja terminar la animación de salida de un modal antes de desmontarlo.
// Va alrededor del render condicional, sin cambiar el modal ni cómo se abre o se cierra:
//   <ModalPresence>{open && <Modal onClose={() => setOpen(false)} />}</ModalPresence>
// Cuando la condición pasa a falso sigue mostrando el último modal, inerte (sin clics ni foco),
// mientras ModalPresence.css lo desvanece. La animación de entrada es solo CSS.
function ModalPresence({ children }) {
    const open = Boolean(children)
    // El último modal que se mostró: es el que se ve mientras sale
    const [last, setLast] = useState(open ? children : null)
    // Cada apertura nueva es otro modal: si se vuelve a abrir mientras sale, no reusa su estado
    const [session, setSession] = useState(0)
    const [wasOpen, setWasOpen] = useState(open)

    if (open !== wasOpen) {
        setWasOpen(open)
        if (open) setSession((current) => current + 1)
    }
    if (open && last !== children) setLast(children)

    const closing = !open && last !== null

    useEffect(() => {
        if (!closing) return
        const timer = setTimeout(() => setLast(null), EXIT_FALLBACK_MS)
        return () => clearTimeout(timer)
    }, [closing])

    if (!open && !closing) return null

    // Solo cuenta la salida del fondo, no la de algo de adentro (por ejemplo un aviso)
    const finishExit = (event) => {
        if (closing && event.animationName === 'modal-fondo-salir') setLast(null)
    }

    return (
        <div
            key={session}
            className='modal-presence'
            data-closing={closing || undefined}
            inert={closing}
            onAnimationEnd={finishExit}
        >
            {open ? children : last}
        </div>
    )
}

export default ModalPresence
