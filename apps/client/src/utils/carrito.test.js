import assert from 'node:assert/strict'
import test from 'node:test'
import { avisoDeContrapedido, cantidadEnCarrito } from './carrito.js'

const linea = (sku, cantidad, existencias, contrapedido = false) => ({ sku, cantidad, existencias, contrapedido })

test('contador: suma las unidades de todas las líneas', () => {
    assert.equal(cantidadEnCarrito({ lineas: [linea('A', 2, 10), linea('B', 1, 10)] }), 3)
    assert.equal(cantidadEnCarrito({ lineas: [] }), 0)
    assert.equal(cantidadEnCarrito(null), 0)
})

test('contrapedido: avisa cuántas unidades pasan de las existencias', () => {
    const carrito = { lineas: [linea('A', 5, 2, true), linea('B', 3, 2, true), linea('C', 1, 4)] }
    assert.equal(avisoDeContrapedido(carrito, 'A'), '3 unidades van por contrapedido.')
    assert.equal(avisoDeContrapedido(carrito, 'B'), '1 unidad va por contrapedido.')
})

test('contrapedido: sin aviso si alcanza o si la línea no está', () => {
    const carrito = { lineas: [linea('C', 1, 4)] }
    assert.equal(avisoDeContrapedido(carrito, 'C'), null)
    assert.equal(avisoDeContrapedido(carrito, 'X'), null)
    assert.equal(avisoDeContrapedido(null, 'C'), null)
})
