import { useCallback, useEffect, useEffectEvent, useState } from 'react'

/**
 * Pide un recurso al servidor y devuelve { datos, cargando, error, recargar }.
 * `pedirRecurso(signal)` hace la llamada y se repite cuando cambia algún valor
 * de `dependencias`, que deben ser primitivos (textos, números).
 * Al cambiar las dependencias o al desmontar se cancela la petición en curso,
 * así una respuesta vieja no pisa a la nueva.
 */
export function useRecursoRemoto(pedirRecurso, dependencias) {
    const [intento, setIntento] = useState(0)
    const clave = JSON.stringify([...dependencias, intento])
    const [resultado, setResultado] = useState({ clave: null, datos: null, error: null })

    const pedirActual = useEffectEvent((signal) => pedirRecurso(signal))

    useEffect(() => {
        const controlador = new AbortController()

        pedirActual(controlador.signal).then(
            (datos) => {
                if (!controlador.signal.aborted) setResultado({ clave, datos, error: null })
            },
            (error) => {
                if (!controlador.signal.aborted) setResultado({ clave, datos: null, error: error.message })
            },
        )

        return () => controlador.abort()
    }, [clave])

    const recargar = useCallback(() => setIntento((anterior) => anterior + 1), [])

    // Mientras llega la respuesta de la clave actual no se muestran datos de otra
    const esActual = resultado.clave === clave
    return {
        datos: esActual ? resultado.datos : null,
        cargando: !esActual,
        error: esActual ? resultado.error : null,
        recargar,
    }
}
