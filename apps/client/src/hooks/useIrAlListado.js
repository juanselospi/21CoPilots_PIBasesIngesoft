import { useCallback, useEffect, useRef } from 'react'

/**
 * Al cambiar de página en un listado, lleva la vista al inicio de ese listado.
 *
 * Mientras llega la página nueva el listado se reemplaza por un «Cargando…» y la página se
 * encoge: dónde queda el scroll lo decide cada navegador (Firefox, por ejemplo, termina en la
 * sección de abajo). Por eso se espera a que la página nueva esté (`listo`) y entonces se lleva
 * `ref` (un elemento que no se desmonta al cargar, como el buscador o el título del listado)
 * al borde de arriba. Si ya se ve, no se mueve nada.
 *
 * Devuelve la función que hay que llamar al cambiar de página; nada más la dispara, así que
 * escribir en el buscador, filtrar o recargar no mueven la vista.
 */
export function useIrAlListado(ref, listo) {
    const pendiente = useRef(false)

    useEffect(() => {
        if (!listo || !pendiente.current) return
        pendiente.current = false
        const elemento = ref.current
        if (!elemento || elemento.getBoundingClientRect().top >= 0) return
        const reducir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        elemento.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' })
    }, [listo, ref])

    return useCallback(() => {
        pendiente.current = true
    }, [])
}
