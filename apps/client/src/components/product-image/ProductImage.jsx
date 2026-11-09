import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import './ProductImage.css'

// Imagen de un producto: mientras carga muestra un skeleton con brillo y al terminar
// la foto aparece con un desvanecido que pasa de borrosa a nítida.
// `className` es la clase de cada pantalla y define el tamaño y la proporción (5:4 en el catálogo),
// así el espacio queda reservado desde el inicio y nada salta al cargar.
// Sin `src` muestra "Sin imagen"; si la imagen falla, "Imagen no disponible" en vez de quedarse cargando.
function ProductImage({ src, alt = '', className = '', emptyClassName = '', iconSize = 28, loading = 'lazy' }) {
    // El estado se guarda con su URL: si cambia la imagen vuelve a "cargando" sin necesidad de un efecto
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

    return (
        <div className={`${className} product-image`} data-status={status} aria-busy={status === 'loading' || undefined}>
            {/* La key crea una imagen nueva por URL, así no llegan eventos de una imagen anterior */}
            <img
                key={src}
                className='product-image-photo'
                src={src}
                alt={alt}
                loading={loading}
                decoding='async'
                onLoad={() => setResult({ src, status: 'loaded' })}
                onError={() => setResult({ src, status: 'error' })}
            />
        </div>
    )
}

export default ProductImage
