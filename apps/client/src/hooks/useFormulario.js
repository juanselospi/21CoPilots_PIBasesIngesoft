import { useEffect, useId, useRef, useState } from 'react'
import { validarCampos } from '../utils/validarCampos.js'

export function useFormulario(iniciales, definicion) {
    const [valores, setValores] = useState(iniciales)
    const [errores, setErrores] = useState({})
    const formularioRef = useRef(null)
    const enfocarRef = useRef(false)
    const id = useId()

    // Después de pintar los mensajes y habilitar los campos, enfoca el primero en orden visual.
    useEffect(() => {
        if (!enfocarRef.current) return
        enfocarRef.current = false
        const primero = Array.from(formularioRef.current?.elements ?? [])
            .find((elemento) => errores[elemento.name] && !elemento.disabled)
        primero?.focus()
    }, [errores])

    const cambiarCampo = (campo, valor) => {
        setValores((actuales) => ({ ...actuales, [campo]: valor }))
        setErrores((actuales) => {
            if (!actuales[campo]) return actuales
            const siguientes = { ...actuales }
            delete siguientes[campo]
            return siguientes
        })
    }

    const validar = () => {
        const encontrados = validarCampos(valores, definicion)
        enfocarRef.current = true
        setErrores(encontrados)
        return Object.keys(encontrados).length === 0
    }

    const erroresServidor = (campos = []) => {
        enfocarRef.current = true
        setErrores(Object.fromEntries(campos.map((campo) => [campo, 'Revise este valor.'])))
    }

    const reiniciar = (siguientes = iniciales) => {
        enfocarRef.current = false
        setValores(siguientes)
        setErrores({})
    }

    const idError = (campo) => `${id}-${campo}-error`
    const atributosCampo = (campo) => ({
        name: campo,
        'aria-required': Boolean(definicion[campo]?.obligatorio),
        'aria-invalid': Boolean(errores[campo]),
        'aria-describedby': errores[campo] ? idError(campo) : undefined,
    })

    return { valores, errores, formularioRef, cambiarCampo, validar, erroresServidor, reiniciar, atributosCampo, idError }
}
