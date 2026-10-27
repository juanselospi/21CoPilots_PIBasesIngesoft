import assert from 'node:assert/strict'
import test from 'node:test'
import { validarCampos } from './validarCampos.js'

test('informa todos los obligatorios vacíos, incluidos espacios, y permite opcionales', () => {
    assert.deepEqual(validarCampos({ codigo: ' ', nombre: '', costo: '', opcional: '' }, {
        codigo: { obligatorio: true },
        nombre: { obligatorio: true },
        costo: { obligatorio: true, tipo: 'numero' },
        opcional: { tipo: 'numero' },
    }), {
        codigo: 'Este campo es obligatorio',
        nombre: 'Este campo es obligatorio',
        costo: 'Este campo es obligatorio',
    })
})

test('valida tipos, mínimos y patrones en el mismo envío', () => {
    const reglas = {
        costo: { tipo: 'numero', minimo: 0 },
        margen: { tipo: 'numero', minimo: -100, exclusivo: true },
        stock: { tipo: 'entero', minimo: 0 },
        correo: { tipo: 'correo' },
        imagen: { tipo: 'url' },
        codigo: { patron: /^[A-Z]+$/ },
    }
    assert.deepEqual(Object.keys(validarCampos({
        costo: '-1', margen: '-100', stock: '1.5', correo: 'correo', imagen: 'ftp://tienda.com', codigo: '123',
    }, reglas)), Object.keys(reglas))
    assert.deepEqual(validarCampos({
        costo: '0', margen: '-99.99', stock: '0', correo: 'nombre@correo.com', imagen: 'https://tienda.com', codigo: 'ABC',
    }, reglas), {})
    for (const costo of ['.', '-', 'Infinity', 'NaN']) {
        assert.ok(validarCampos({ costo }, reglas).costo)
    }
})
