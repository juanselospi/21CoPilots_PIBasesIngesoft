import { useEffect, useEffectEvent, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

const claveDe = (key) => `scroll:${key}`

/**
 * Posición de la página por entrada del historial. Al volver (atrás del navegador o la flecha
 * de regreso) la restaura cuando `listo` es true, es decir, cuando ya están los productos;
 * al llegar por un enlace empieza arriba. Lo guarda en sessionStorage para que sobreviva a recargar.
 * `alLlegar`, si viene, reemplaza al «empieza arriba» (el catálogo baja solo hasta sus resultados
 * al cambiar de página).
 */
export function useRestaurarScroll(listo, { alLlegar } = {}) {
    const { key } = useLocation()
    const tipo = useNavigationType()
    // Última posición vista al desplazarse (null si todavía no hubo scroll). No se lee window.scrollY
    // al salir porque para entonces la página nueva ya pudo cambiar el alto del documento.
    // Con null no se guarda nada: así el montaje doble de StrictMode no borra la posición guardada.
    const ultimaRef = useRef(null)

    useEffect(() => {
        // Cada entrada del historial empieza sin posición propia
        ultimaRef.current = null
        const guardar = () => {
            if (ultimaRef.current === null) return
            try {
                sessionStorage.setItem(claveDe(key), String(ultimaRef.current))
            } catch {
                // Sin sessionStorage simplemente no se restaura
            }
        }
        const alDesplazar = () => {
            ultimaRef.current = window.scrollY
        }
        window.addEventListener('scroll', alDesplazar, { passive: true })
        window.addEventListener('pagehide', guardar)
        return () => {
            window.removeEventListener('scroll', alDesplazar)
            window.removeEventListener('pagehide', guardar)
            guardar()
        }
    }, [key])

    const llegar = useEffectEvent(() => (alLlegar ? alLlegar() : window.scrollTo(0, 0)))

    useEffect(() => {
        if (!listo) return
        let guardada = null
        try {
            guardada = sessionStorage.getItem(claveDe(key))
        } catch {
            // Sin sessionStorage la página empieza arriba
        }
        if (tipo !== 'POP' || guardada === null) {
            llegar()
            return
        }
        const y = Number(guardada)
        window.scrollTo(0, Number.isFinite(y) ? y : 0)
    }, [listo, key, tipo])
}
