import { useEffect, useId, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Info } from 'lucide-react'
import './InfoTip.css'

// Margen para pasar el mouse del ícono al globo sin que se cierre
const HOVER_CLOSE_MS = 150

const isMouse = (event) => event.pointerType === 'mouse'

// Ícono (i) junto a la etiqueta de un campo con una explicación corta en `children`.
// Con mouse se abre al pasar por encima y un clic lo deja fijo; al tocarlo o con
// Enter/Espacio se abre y se cierra. Radix pone el portal y el cierre con Escape o clic afuera.
// No va dentro de un <label>: su texto quedaría en el nombre del input.
// El lector de pantalla oye la explicación como descripción del botón, sin abrirlo.
function InfoTip({ label, children }) {
    const [open, setOpen] = useState(false)
    // Abierto con clic, toque o teclado: no se cierra al quitar el mouse
    const [pinned, setPinned] = useState(false)
    const descriptionId = useId()
    const closeTimer = useRef(null)

    const cancelClose = () => clearTimeout(closeTimer.current)
    useEffect(() => cancelClose, [])

    const openOnHover = (event) => {
        if (!isMouse(event)) return
        cancelClose()
        setOpen(true)
    }

    const closeOnLeave = (event) => {
        if (!isMouse(event) || pinned) return
        cancelClose()
        closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_MS)
    }

    const changeOpen = (next) => {
        cancelClose()
        setOpen(next)
        setPinned(next)
    }

    // Si ya se abrió con el mouse, el clic lo fija en vez de cerrarlo
    const pinOnClick = (event) => {
        if (open && !pinned) {
            event.preventDefault()
            setPinned(true)
        }
    }

    return (
        <Popover.Root open={open} onOpenChange={changeOpen}>
            <Popover.Trigger
                type='button'
                className='info-tip-trigger'
                aria-label={`Ayuda: ${label}`}
                aria-describedby={descriptionId}
                onPointerEnter={openOnHover}
                onPointerLeave={closeOnLeave}
                onClick={pinOnClick}
            >
                <Info size={15} aria-hidden='true' />
            </Popover.Trigger>
            <span id={descriptionId} hidden>{children}</span>

            <Popover.Portal>
                <Popover.Content
                    className='info-tip-content'
                    side='top'
                    align='start'
                    sideOffset={6}
                    collisionPadding={8}
                    // El foco se queda en el ícono: el texto ya lo leyó el lector como descripción
                    onOpenAutoFocus={(event) => event.preventDefault()}
                    // Escape cierra solo la ayuda, no el modal que la contiene
                    onEscapeKeyDown={(event) => event.stopPropagation()}
                    onPointerEnter={openOnHover}
                    onPointerLeave={closeOnLeave}
                >
                    <strong>{label}</strong>
                    <p>{children}</p>
                    <Popover.Arrow className='info-tip-arrow' width={12} height={6} />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}

export default InfoTip
