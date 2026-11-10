import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import './ProductImage.css'

const MAX_ZOOM = 2

// Imagen de un producto: mientras carga muestra un skeleton con brillo y al terminar
// la foto aparece con un desvanecido que pasa de borrosa a nítida.
// `className` es la clase de cada pantalla y define el tamaño y la proporción (5:4 en el catálogo),
// así el espacio queda reservado desde el inicio y nada salta al cargar.
// Sin `src` muestra "Sin imagen"; si la imagen falla, "Imagen no disponible" en vez de quedarse cargando.
//
// `fit='contain'` (por defecto) muestra el producto completo, centrado y sin deformar sobre un fondo
// de foto; cada pantalla define el aire alrededor con --product-image-margen. `fit='cover'` llena el
// marco recortando lo que sobra (para fotos de ambiente, hoy no se usa).
// `fetchPriority='high'` para la imagen principal de una página, que no debe esperar a las demás.
function ProductImage({
    src, alt = '', className = '', emptyClassName = '', iconSize = 28, loading = 'lazy', fit = 'contain', fetchPriority,
}) {
    // El estado se guarda con su URL: si cambia la imagen vuelve a "cargando" sin necesidad de un efecto.
    // Al cargar guarda el tamaño real de la foto para no ampliarla de más
    const [result, setResult] = useState({ src: null, status: 'loading' })
    const status = result.src === src ? result.status : 'loading'

    if (!src) {
        return (
            <div className={`${className} ${emptyClassName}`}>
                <ImageOff size={iconSize} aria-hidden='true' />Sin imagen
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className={`${className} ${emptyClassName} product-image-error`}>
                <ImageOff size={iconSize} aria-hidden='true' />Imagen no disponible
            </div>
        )
    }

    // Una foto pequeña se amplía como mucho MAX_ZOOM veces su tamaño real: más se vería pixelada
    const maxSize = fit === 'contain' && status === 'loaded' && result.width
        ? { '--product-image-max-ancho': `${result.width * MAX_ZOOM}px`, '--product-image-max-alto': `${result.height * MAX_ZOOM}px` }
        : undefined

    return (
        <div
            className={`${className} product-image product-image-${fit}`}
            style={maxSize}
            data-status={status}
            aria-busy={status === 'loading' || undefined}
        >
            {/* La key crea una imagen nueva por URL, así no llegan eventos de una imagen anterior */}
            <img
                key={src}
                className='product-image-photo'
                src={src}
                alt={alt}
                loading={loading}
                fetchPriority={fetchPriority}
                decoding='async'
                onLoad={(event) => setResult({
                    src, status: 'loaded', width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight,
                })}
                onError={() => setResult({ src, status: 'error' })}
            />
        </div>
    )
}

export default ProductImage
