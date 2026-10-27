// SCRUM-97: devuelve todos los errores del formulario en un solo recorrido.
export function validarCampos(valores, definicion) {
    const errores = {}
    for (const [campo, reglas] of Object.entries(definicion)) {
        const valor = String(valores[campo] ?? '').trim()
        if (!valor) {
            if (reglas.obligatorio) errores[campo] = 'Este campo es obligatorio'
            continue
        }

        if (reglas.tipo === 'numero' || reglas.tipo === 'entero') {
            const numero = Number(valor)
            if (!Number.isFinite(numero) || (reglas.tipo === 'entero' && !Number.isInteger(numero))) {
                errores[campo] = 'Ingrese un número válido.'
            } else if (reglas.minimo !== undefined && (
                reglas.exclusivo ? numero <= reglas.minimo : numero < reglas.minimo
            )) {
                errores[campo] = reglas.mensajeMinimo ?? `El valor mínimo es ${reglas.minimo}.`
            }
        } else if (reglas.tipo === 'correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
            errores[campo] = 'Ingrese un correo electrónico válido.'
        } else if (reglas.tipo === 'url') {
            try {
                const url = new URL(valor)
                if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
            } catch {
                errores[campo] = 'Ingrese una dirección web válida (http o https).'
            }
        }

        if (!errores[campo] && reglas.patron && !new RegExp(reglas.patron).test(valor)) {
            errores[campo] = reglas.mensajePatron ?? 'Revise el formato de este campo.'
        }
    }
    return errores
}
