import assert from 'node:assert/strict'
import test from 'node:test'
import { reglasCedula, reglasTelefono } from './reglasCliente.js'
import { validarCampos } from './validarCampos.js'

const valido = (reglas, valor) => !validarCampos({ campo: valor }, { campo: reglas }).campo

test('teléfono: 8 dígitos con o sin separador', () => {
    for (const telefono of ['8888-8888', '88888888', '2222 0000']) {
        assert.ok(valido(reglasTelefono, telefono), telefono)
    }
    for (const telefono of ['8888-888', '888888889', '8888--8888', 'abcd-efgh', '+506 8888-8888']) {
        assert.ok(!valido(reglasTelefono, telefono), telefono)
    }
})

test('cédula: física, jurídica y DIMEX, con o sin guiones', () => {
    for (const cedula of ['1-1111-1111', '111111111', '3-101-123456', '3101123456', '155812345678']) {
        assert.ok(valido(reglasCedula, cedula), cedula)
    }
    for (const cedula of ['1-1111-111', '12345678', '1234567890123', '1-1111-111A', '-111111111', '111111111-']) {
        assert.ok(!valido(reglasCedula, cedula), cedula)
    }
})
