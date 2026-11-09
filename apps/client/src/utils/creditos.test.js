import assert from 'node:assert/strict'
import test from 'node:test'
import { movimientoDeCredito } from './creditos.js'

test('un credito otorgado suma y conserva su motivo y pedido', () => {
    assert.deepEqual(movimientoDeCredito({ tipo: 'otorgado', motivo: 'Cancelación del pedido 4', numCarrito: 4 }), {
        etiqueta: 'A favor',
        signo: '+',
        motivo: 'Cancelación del pedido 4',
        numCarrito: 4,
    })
})

test('un pago con credito resta y dice que fue, aunque no traiga motivo', () => {
    const movimiento = movimientoDeCredito({ tipo: 'usado', motivo: null, numCarrito: 7 })

    assert.equal(movimiento.etiqueta, 'Usado')
    assert.equal(movimiento.signo, '−')
    assert.equal(movimiento.motivo, 'Pago con tu saldo a favor')
    assert.equal(movimiento.numCarrito, 7)
})

test('un credito sin pedido no inventa un numero', () => {
    assert.equal(movimientoDeCredito({ tipo: 'otorgado', motivo: 'Ajuste', numCarrito: undefined }).numCarrito, null)
})
