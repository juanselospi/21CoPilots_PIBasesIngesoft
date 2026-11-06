import assert from 'node:assert/strict'
import test from 'node:test'
import {
    aCantidad, avisoDeContrapedido, avisoDeLinea, cantidadEnCarrito, disponibilidadDeLinea,
    hayFueraDeStock, precioDeLinea, reglasCantidad, totalDeLinea,
} from './carrito.js'
import { validarCampos } from './validarCampos.js'

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

test('contrapedido: el aviso de una línea es el mismo que sale al agregar', () => {
    assert.equal(avisoDeLinea(linea('A', 5, 2, true)), '3 unidades van por contrapedido.')
    assert.equal(avisoDeLinea(linea('C', 1, 4)), null)
})

test('cantidad: queda entre 1 y 999, lo que no es número cuenta como 1', () => {
    assert.equal(aCantidad('5'), 5)
    assert.equal(aCantidad('0'), 1)
    assert.equal(aCantidad(''), 1)
    assert.equal(aCantidad('abc'), 1)
    assert.equal(aCantidad('1500'), 999)
})

test('cantidad: las reglas piden un entero de 1 a 999', () => {
    const error = (cantidad) => validarCampos({ cantidad }, reglasCantidad).cantidad
    assert.equal(error('1'), undefined)
    assert.equal(error('999'), undefined)
    assert.equal(error(''), 'Este campo es obligatorio')
    assert.equal(error('0'), 'El valor mínimo es 1.')
    assert.equal(error('1000'), 'El valor máximo es 999.')
    assert.equal(error('1.5'), 'Ingrese un número válido.')
})

test('disponibilidad: pasa la del servidor a la que usa la etiqueta', () => {
    assert.equal(disponibilidadDeLinea({ disponibilidad: 'en_existencia' }), 'in-stock')
    assert.equal(disponibilidadDeLinea({ disponibilidad: 'contrapedido' }), 'backorder')
    assert.equal(disponibilidadDeLinea({ disponibilidad: 'fuera_de_stock' }), 'out-of-stock')
})

test('fuera de stock: con una sola línea ya no se puede finalizar la compra', () => {
    const normal = { disponibilidad: 'en_existencia' }
    const contrapedido = { disponibilidad: 'contrapedido' }
    const agotada = { disponibilidad: 'fuera_de_stock' }
    assert.equal(hayFueraDeStock({ lineas: [normal, contrapedido] }), false)
    assert.equal(hayFueraDeStock({ lineas: [normal, agotada] }), true)
    assert.equal(hayFueraDeStock({ lineas: [] }), false)
    assert.equal(hayFueraDeStock(null), false)
})

test('línea: el total lleva impuesto y el precio es el final de la unidad', () => {
    const conPrecio = { cantidad: 2, precioFinal: 11.3, subtotal: 20, impuesto: 2.6 }
    assert.equal(totalDeLinea(conPrecio), 22.6)
    assert.equal(precioDeLinea(conPrecio), 11.3)
    // Un producto que ya no existe llega sin precioFinal
    assert.equal(precioDeLinea({ ...conPrecio, precioFinal: null }), 11.3)
})
