import assert from 'node:assert/strict'
import test from 'node:test'
import {
    camposDelServidor, cambiosDeContacto, cantidadDeTelefonos, definicionDeContacto, valoresDeContacto,
} from './datosDeContacto.js'
import { validarCampos } from './validarCampos.js'

const cuenta = { direccion: 'San José, Montes de Oca', telefonos: ['2222-0000', '8888-8888'] }

test('valores iniciales: la dirección y un campo por teléfono', () => {
    const valores = valoresDeContacto(cuenta)
    assert.equal(valores.direccion, 'San José, Montes de Oca')
    assert.equal(valores.telefono0, '2222-0000')
    assert.equal(valores.telefono1, '8888-8888')
    assert.equal(valores.telefono2, '')
    assert.equal(cantidadDeTelefonos(cuenta), 2)
    assert.equal(cantidadDeTelefonos({ telefonos: [] }), 1)
})

test('validación: dirección obligatoria y cada teléfono con 8 dígitos', () => {
    const valores = { ...valoresDeContacto(cuenta), direccion: '  ', telefono1: '123' }
    const errores = validarCampos(valores, definicionDeContacto(2))
    assert.deepEqual(Object.keys(errores).sort(), ['direccion', 'telefono1'])
})

test('validación: los teléfonos que no se ven no cuentan', () => {
    const valores = { ...valoresDeContacto(cuenta), telefono3: 'abc' }
    assert.deepEqual(validarCampos(valores, definicionDeContacto(2)), {})
})

test('cambios: solo manda lo que cambió', () => {
    const valores = valoresDeContacto(cuenta)
    assert.deepEqual(cambiosDeContacto(valores, 2, cuenta), {})

    assert.deepEqual(
        cambiosDeContacto({ ...valores, direccion: ' Heredia centro ' }, 2, cuenta),
        { direccion: 'Heredia centro' },
    )
    assert.deepEqual(
        cambiosDeContacto({ ...valores, telefono2: '7777 7777' }, 3, cuenta),
        { telefonos: ['2222-0000', '8888-8888', '7777 7777'] },
    )
    assert.deepEqual(cambiosDeContacto(valores, 1, cuenta), { telefonos: ['2222-0000'] })
})

test('errores del servidor: "telefonos" se marca en el primer teléfono', () => {
    assert.deepEqual(camposDelServidor(['direccion', 'telefonos']), ['direccion', 'telefono0'])
    assert.deepEqual(camposDelServidor(), [])
})
