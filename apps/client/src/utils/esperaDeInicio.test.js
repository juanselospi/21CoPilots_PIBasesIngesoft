import assert from 'node:assert/strict'
import test from 'node:test'
import { DEMASIADOS_INTENTOS, finDelBloqueo, mensajeDeEspera, minutosRestantes } from './esperaDeInicio.js'

const AHORA = Date.UTC(2026, 10, 10, 12)

test('espera: cuenta los minutos que faltan redondeando hacia arriba', () => {
    assert.equal(minutosRestantes(AHORA + 10 * 60000, AHORA), 10)
    assert.equal(minutosRestantes(AHORA + 9 * 60000 + 1000, AHORA), 10)
    assert.equal(minutosRestantes(AHORA + 30000, AHORA), 1)
    assert.equal(minutosRestantes(AHORA - 1000, AHORA), 0)
})

test('espera: el mensaje dice cuánto falta, en singular cuando es un minuto', () => {
    assert.equal(mensajeDeEspera(10), 'Demasiados intentos fallidos. Podrás volver a intentarlo en 10 minutos.')
    assert.equal(mensajeDeEspera(1), 'Demasiados intentos fallidos. Podrás volver a intentarlo en 1 minuto.')
})

test('espera: solo el bloqueo por intentos trae fecha de fin', () => {
    const bloqueo = { codigo: DEMASIADOS_INTENTOS, detalles: { reintentarEnSegundos: 600 } }
    assert.equal(finDelBloqueo(bloqueo, AHORA), AHORA + 600000)
    assert.equal(finDelBloqueo({ codigo: 'CREDENCIALES_INVALIDAS' }, AHORA), null)
    assert.equal(finDelBloqueo(null, AHORA), null)
})
