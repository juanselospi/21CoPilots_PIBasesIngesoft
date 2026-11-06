import { Link, useLocation, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import './BackButton.css'
import { rutaDeVuelta } from '../../utils/rutaDeVuelta.js'

// Destino de cada página principal para la etiqueta accesible («Volver a Productos», «Volver al catálogo»)
const destinations = [
    ['/admin/productos', 'a Productos'],
    ['/admin/familias', 'a Familias'],
    ['/admin/mercancia', 'a Mercancía'],
    ['/admin/pedidos', 'a Pedidos'],
    ['/catalogo', 'al catálogo'],
    ['/carrito', 'al carrito'],
    ['/mi-cuenta', 'a Mi cuenta'],
]
const destination = (path) => {
    const [pathname, search = ''] = path.split('#')[0].split('?')
    if (pathname === '/catalogo' && new URLSearchParams(search).get('q')) return 'a los resultados de la búsqueda'
    if (pathname === '/') return 'a la tienda'
    // Una categoría se nombra: «Volver a Legos»
    const category = pathname.match(/^\/catalogo\/([^/]+)$/)?.[1]
    if (category) {
        try {
            return `a ${decodeURIComponent(category)}`
        } catch {
            return 'al catálogo'
        }
    }
    return destinations.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? 'a la página anterior'
}

// Flecha para volver de una vista secundaria a la página desde la que se llegó.
// - Si el enlace que trajo hasta aquí dejó `state.from` (ver backState en routes.js) y es una ruta de la tienda,
//   vuelve ahí con el historial: conserva la ruta, la búsqueda, los filtros y la posición de la página.
// - Si se entró con la URL, en otra pestaña o sin origen, va a `fallback` (la página principal).
// Es un enlace real: abrirlo en otra pestaña o copiarlo lleva al mismo destino.
// `label` muestra el texto junto a la flecha (por ejemplo «Volver a la tienda»); sin él, solo la flecha.
function BackButton({ fallback, label }) {
    const location = useLocation()
    const navigate = useNavigate()
    const from = rutaDeVuelta(location.state?.from)
    const to = from ?? fallback
    // Solo con origen conocido y una entrada anterior de esta app en el historial
    const canGoBack = Boolean(from) && (window.history.state?.idx ?? 0) > 0

    const handleClick = (event) => {
        if (!canGoBack || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
        event.preventDefault()
        navigate(-1)
    }

    return (
        <Link
            to={to}
            className={label ? 'back-button back-button-text' : 'back-button'}
            aria-label={label ? undefined : `Volver ${destination(to)}`}
            onClick={handleClick}
        >
            <ArrowLeft size={label ? 16 : 20} aria-hidden='true' />
            {label}
        </Link>
    )
}

export default BackButton
