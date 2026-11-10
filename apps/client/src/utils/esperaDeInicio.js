// Cuenta regresiva cuando el servidor bloquea un correo por demasiados intentos fallidos

export const DEMASIADOS_INTENTOS = 'DEMASIADOS_INTENTOS'

// Minutos que faltan, redondeados hacia arriba: con 30 segundos todavia falta "1 minuto"
export const minutosRestantes = (hasta, ahora = Date.now()) => Math.max(0, Math.ceil((hasta - ahora) / 60000))

export function mensajeDeEspera(minutos) {
    return `Demasiados intentos fallidos. Podrás volver a intentarlo en ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`
}

// Hasta cuando esta bloqueado segun lo que respondio el servidor, o null si el error es otro
export function finDelBloqueo(error, ahora = Date.now()) {
    const segundos = error?.codigo === DEMASIADOS_INTENTOS ? error.detalles?.reintentarEnSegundos : null
    return segundos > 0 ? ahora + segundos * 1000 : null
}
