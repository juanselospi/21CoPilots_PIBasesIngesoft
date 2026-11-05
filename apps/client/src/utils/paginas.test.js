import assert from 'node:assert/strict'
import test from 'node:test'
import { elementosDePaginacion, paginasVisibles } from './paginas.js'

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

test('con siete páginas o menos no hay puntos suspensivos', () => {
    assert.deepEqual(elementosDePaginacion(0, 1), [0])
    assert.deepEqual(elementosDePaginacion(3, 7), [0, 1, 2, 3, 4, 5, 6])
})

test('al inicio muestra las primeras cinco y la última', () => {
    assert.deepEqual(elementosDePaginacion(0, 19), [0, 1, 2, 3, 4, '…', 18])
    assert.deepEqual(elementosDePaginacion(3, 19), [0, 1, 2, 3, 4, '…', 18])
})

test('en el medio muestra la primera, las vecinas de la actual y la última', () => {
    assert.deepEqual(elementosDePaginacion(8, 19), [0, '…', 7, 8, 9, '…', 18])
})

test('al final muestra la primera y las últimas cinco', () => {
    assert.deepEqual(elementosDePaginacion(18, 19), [0, '…', 14, 15, 16, 17, 18])
    assert.deepEqual(elementosDePaginacion(15, 19), [0, '…', 14, 15, 16, 17, 18])
})
