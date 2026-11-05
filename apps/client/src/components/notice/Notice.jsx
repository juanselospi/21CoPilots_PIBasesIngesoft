import { useEffect, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import './Notice.css'

// Cuánto se ve cada tipo antes de irse solo; null = se queda hasta que lo cierren
const durationByType = { success: 4000, info: 5000, warning: null, error: null }
const iconByType = { success: CircleCheck, info: Info, warning: TriangleAlert, error: CircleAlert }

// Igual a la transición de salida de Notice.css
const EXIT_MS = 200
const exitDelay = () => (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : EXIT_MS)

// Aviso del panel: éxito, información, advertencia o error, con botón para cerrarlo.
// Los de éxito e información se van solos; el tiempo se detiene mientras el puntero
// o el foco están encima, para no quitarle el aviso a quien lo está usando.
// Para mostrar otro aviso, el padre le cambia la `key`: así arranca con su propio tiempo.
function Notice({ type = 'success', duration = durationByType[type], onClose, children }) {
    const [leaving, setLeaving] = useState(false)
    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)
    // Los temporizadores siempre llaman al onClose más reciente
    const onCloseRef = useRef(onClose)
    useEffect(() => {
        onCloseRef.current = onClose
    })

    // Cuenta regresiva; se reinicia al soltar el puntero o el foco
    useEffect(() => {
        if (!duration || leaving || hovered || focused) return
        const timer = setTimeout(() => setLeaving(true), duration)
        return () => clearTimeout(timer)
    }, [duration, leaving, hovered, focused])

    // Deja terminar la animación de salida y avisa al padre para que lo quite
    useEffect(() => {
        if (!leaving) return
        const timer = setTimeout(() => onCloseRef.current?.(), exitDelay())
        return () => clearTimeout(timer)
    }, [leaving])

    const Icon = iconByType[type]
    const urgent = type === 'error' || type === 'warning'

    return (
        <div
            className={`notice notice-${type}${leaving ? ' notice-leaving' : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setFocused(false)}
        >
            <div className='notice-inner'>
                <div className='notice-body'>
                    <Icon className='notice-icon' size={18} aria-hidden='true' />
                    <p className='notice-text' role={urgent ? 'alert' : 'status'}>{children}</p>
                    {onClose && (
                        <button
                            type='button'
                            className='notice-close'
                            aria-label='Cerrar aviso'
                            disabled={leaving}
                            onClick={() => setLeaving(true)}
                        >
                            <X size={16} aria-hidden='true' />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Notice
