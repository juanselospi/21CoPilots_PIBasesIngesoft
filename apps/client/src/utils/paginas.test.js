import assert from 'node:assert/strict'
import test from 'node:test'
import { paginasVisibles } from './paginas.js'

test('con pocas páginas las muestra todas', () => {
    assert.deepEqual(paginasVisibles(0, 3), [0, 1, 2])
})

test('la página actual queda en el centro', () => {
    assert.deepEqual(paginasVisibles(4, 10), [2, 3, 4, 5, 6])
})

test('al inicio y al final la ventana se corre para mostrar cinco', () => {
    assert.deepEqual(paginasVisibles(0, 10), [0, 1, 2, 3, 4])
    assert.deepEqual(paginasVisibles(9, 10), [5, 6, 7, 8, 9])
})

test('con una sola página devuelve solo esa', () => {
    assert.deepEqual(paginasVisibles(0, 1), [0])
})
