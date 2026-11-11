import assert from 'node:assert/strict'
import test from 'node:test'
import {
    PAGO_VACIO, camposDelPago, creditoQueSeUsa, cuerpoDeConfirmacion, formatoCvv, formatoTarjeta, formatoVencimiento,
    largoConEspacios, marcaDeTarjeta, nombreDelMetodo,
    pasoDeLosCampos, reglasDeEntrega, reglasDePago, restantePorPagar, tarjetaVencida, totalConEnvio, ultimosDigitos,
} from './checkout.js'
import { validarCampos } from './validarCampos.js'

const HOY = new Date(2026, 10, 6)
const conDireccion = { modalidad: 'mensajero', costo: 3.5, exigeDireccion: true }
const sinDireccion = { modalidad: 'entrega_personal', costo: 0, exigeDireccion: false }

test('entrega: sin modalidad solo pide la modalidad', () => {
    assert.deepEqual(Object.keys(validarCampos({ modalidadEntrega: '', direccion: '' }, reglasDeEntrega())), ['modalidadEntrega'])
})

test('entrega: la dirección se pide solo si la modalidad la necesita', () => {
    const valores = { modalidadEntrega: 'mensajero', direccion: '  ' }
    assert.deepEqual(Object.keys(validarCampos(valores, reglasDeEntrega(conDireccion))), ['direccion'])
    assert.deepEqual(validarCampos(valores, reglasDeEntrega(sinDireccion)), {})
})

test('vencimiento: sirve hasta el último día del mes', () => {
    assert.equal(tarjetaVencida('11/26', HOY), false)
    assert.equal(tarjetaVencida('11/26', new Date(2026, 10, 30, 23, 59)), false)
    assert.equal(tarjetaVencida('11/26', new Date(2026, 11, 1)), true)
    assert.equal(tarjetaVencida('10/26', HOY), true)
    assert.equal(tarjetaVencida('01/27', HOY), false)
})

test('pago: sin método pide el método y sin tarjeta no pide sus datos', () => {
    assert.deepEqual(Object.keys(validarCampos(PAGO_VACIO, reglasDePago('', HOY))), ['metodoPago'])
    assert.deepEqual(validarCampos({ ...PAGO_VACIO, metodoPago: 'sinpe_movil' }, reglasDePago('sinpe_movil', HOY)), {})
    assert.deepEqual(validarCampos({ ...PAGO_VACIO, metodoPago: 'contra_entrega' }, reglasDePago('contra_entrega', HOY)), {})
})

test('pago: con tarjeta marca todos los datos a la vez', () => {
    const errores = validarCampos({ ...PAGO_VACIO, metodoPago: 'tarjeta' }, reglasDePago('tarjeta', HOY))
    assert.deepEqual(Object.keys(errores).sort(), ['cvv', 'numeroTarjeta', 'vencimiento'])
})

test('pago: revisa el formato de la tarjeta', () => {
    const reglas = reglasDePago('tarjeta', HOY)
    const errores = (cambios) => validarCampos({ metodoPago: 'tarjeta', numeroTarjeta: '4111 1111 1111 1111', vencimiento: '08/29', cvv: '123', ...cambios }, reglas)

    assert.deepEqual(errores({}), {})
    // La de la demo que se rechaza sigue siendo válida en la pantalla
    assert.deepEqual(errores({ numeroTarjeta: '4111-1111-1111-0000' }), {})
    assert.equal(errores({ numeroTarjeta: '41111' }).numeroTarjeta, 'Las tarjetas Visa llevan 16 dígitos.')
    assert.equal(errores({ vencimiento: '13/29' }).vencimiento, 'Ingrese el mes y el año, por ejemplo 08/29.')
    assert.equal(errores({ vencimiento: '10/26' }).vencimiento, 'Esta tarjeta ya venció.')
    assert.equal(errores({ cvv: '12' }).cvv, 'Ingrese los 3 dígitos de atrás de la tarjeta.')
})

test('tarjeta: cada marca pide su cantidad de dígitos y las demás de 12 a 19', () => {
    const numero = (valor) => validarCampos({ numeroTarjeta: valor }, { numeroTarjeta: reglasDePago('tarjeta', HOY).numeroTarjeta }).numeroTarjeta

    assert.equal(numero('4111 1111 1111 1111'), undefined)
    assert.equal(numero('4111 1111 1111 111'), 'Las tarjetas Visa llevan 16 dígitos.')
    assert.equal(numero('5555 5555 5555 444'), 'Las tarjetas Mastercard llevan 16 dígitos.')
    assert.equal(numero('3782 8224 6310 005'), undefined)
    assert.equal(numero('3782 8224 6310 0055'), 'Las tarjetas American Express llevan 15 dígitos.')
    assert.equal(numero('6011 0000 0000'), undefined)
    assert.equal(numero('6011 0000 000'), 'Ingrese de 12 a 19 dígitos.')
    assert.equal(numero('4111 1111 abcd 1111'), 'El número de la tarjeta solo lleva dígitos.')
})

test('tarjeta: al escribir deja solo dígitos, en grupos de 4 y sin pasarse del largo de la marca', () => {
    assert.equal(formatoTarjeta('4111111111111111'), '4111 1111 1111 1111')
    assert.equal(formatoTarjeta('4111-1111-1111-1111-99'), '4111 1111 1111 1111')
    assert.equal(formatoTarjeta('41a1 1'), '4111')
    assert.equal(formatoTarjeta('378282246310005999'), '3782 8224 6310 005')
    assert.equal(formatoTarjeta('60110000000000000000000'), '6011 0000 0000 0000 000')
    assert.equal(formatoTarjeta(''), '')
    assert.equal(largoConEspacios('visa'), 19)
    assert.equal(largoConEspacios('amex'), 18)
    assert.equal(largoConEspacios(null), 23)
})

test('tarjeta: el CVV solo deja escribir dígitos y los que lleva la marca', () => {
    assert.equal(formatoCvv('12a34', 'visa'), '123')
    assert.equal(formatoCvv('12345', 'amex'), '1234')
    assert.equal(formatoCvv('12345', null), '1234')
})

test('tarjeta: reconoce la marca por cómo empieza el número', () => {
    assert.equal(marcaDeTarjeta('4111 1111 1111 1111'), 'visa')
    assert.equal(marcaDeTarjeta('5555 5555 5555 4444'), 'mastercard')
    assert.equal(marcaDeTarjeta('2221 0000 0000 0009'), 'mastercard')
    assert.equal(marcaDeTarjeta('2721 0000 0000 0000'), null)
    assert.equal(marcaDeTarjeta('3782 822463 10005'), 'amex')
    assert.equal(marcaDeTarjeta('6011 0000 0000 0000'), null)
    assert.equal(marcaDeTarjeta(''), null)
})

test('tarjeta: el CVV lleva 4 dígitos en American Express y 3 en Visa y Mastercard', () => {
    const reglas = reglasDePago('tarjeta', HOY)
    const cvv = (numeroTarjeta, valor) =>
        validarCampos({ metodoPago: 'tarjeta', numeroTarjeta, vencimiento: '08/29', cvv: valor }, reglas).cvv

    assert.equal(cvv('3782 822463 10005', '1234'), undefined)
    assert.equal(cvv('3782 822463 10005', '123'), 'Las American Express llevan 4 dígitos al frente de la tarjeta.')
    assert.equal(cvv('4111 1111 1111 1111', '1234'), 'Ingrese los 3 dígitos de atrás de la tarjeta.')
    assert.equal(cvv('5555 5555 5555 4444', '123'), undefined)
    // Una marca que no se reconoce acepta 3 o 4
    assert.equal(cvv('6011 0000 0000 0000', '1234'), undefined)
    assert.equal(cvv('6011 0000 0000 0000', '12'), 'Ingrese los 3 o 4 dígitos de atrás de la tarjeta.')
})

test('vencimiento: pone la barra mientras se escribe', () => {
    assert.equal(formatoVencimiento('08'), '08')
    assert.equal(formatoVencimiento('0829'), '08/29')
    assert.equal(formatoVencimiento('08/2'), '08/2')
    assert.equal(formatoVencimiento('08295'), '08/29')
})

test('cuerpo: de la tarjeta solo sale el número limpio', () => {
    const pago = { metodoPago: 'tarjeta', numeroTarjeta: '4111 1111-1111 1111', vencimiento: '08/29', cvv: '123' }
    const cuerpo = cuerpoDeConfirmacion({ modalidadEntrega: 'mensajero', direccion: ' San Pedro ' }, pago, conDireccion)

    assert.deepEqual(cuerpo, {
        modalidadEntrega: 'mensajero',
        direccion: 'San Pedro',
        metodoPago: 'tarjeta',
        datosTarjeta: { numero: '4111111111111111' },
        usarCredito: false,
    })
    assert.equal(JSON.stringify(cuerpo).includes('123"'), false)
})

test('cuerpo: sin tarjeta ni dirección cuando no hacen falta', () => {
    const cuerpo = cuerpoDeConfirmacion(
        { modalidadEntrega: 'entrega_personal', direccion: 'San Pedro' },
        { ...PAGO_VACIO, metodoPago: 'sinpe_movil', numeroTarjeta: '4111111111111111' },
        sinDireccion,
    )
    assert.equal(cuerpo.direccion, null)
    assert.equal(cuerpo.datosTarjeta, null)
})

test('crédito: se usa todo el saldo o solo lo que cuesta el pedido', () => {
    const conCredito = { ...PAGO_VACIO, usarCredito: true }

    assert.equal(creditoQueSeUsa(conCredito, 30, 74.7), 30)
    assert.equal(creditoQueSeUsa(conCredito, 100, 74.7), 74.7)
    assert.equal(creditoQueSeUsa(PAGO_VACIO, 100, 74.7), 0)
    assert.equal(creditoQueSeUsa(conCredito, 0, 74.7), 0)
    assert.equal(restantePorPagar(74.7, 30), 44.7)
})

test('crédito: si cubre todo no pide medio de pago ni lo manda', () => {
    const pago = { ...PAGO_VACIO, usarCredito: true }

    assert.deepEqual(validarCampos(pago, reglasDePago('', HOY, { creditoCubreTodo: true })), {})
    const cuerpo = cuerpoDeConfirmacion(
        { modalidadEntrega: 'entrega_personal', direccion: '' }, pago, sinDireccion, { creditoCubreTodo: true },
    )
    assert.equal(cuerpo.metodoPago, null)
    assert.equal(cuerpo.datosTarjeta, null)
    assert.equal(cuerpo.usarCredito, true)
    assert.equal(nombreDelMetodo('credito'), 'Crédito a favor')
})

test('crédito: si no alcanza el resto se paga con el medio escogido', () => {
    const pago = { ...PAGO_VACIO, usarCredito: true, metodoPago: 'tarjeta', numeroTarjeta: '4111 1111 1111 1111' }

    assert.deepEqual(Object.keys(validarCampos({ ...pago, metodoPago: '' }, reglasDePago('', HOY))), ['metodoPago'])
    const cuerpo = cuerpoDeConfirmacion({ modalidadEntrega: 'entrega_personal', direccion: '' }, pago, sinDireccion)
    assert.deepEqual([cuerpo.metodoPago, cuerpo.datosTarjeta, cuerpo.usarCredito], ['tarjeta', { numero: '4111111111111111' }, true])
})

test('total: suma el envío sin arrastrar decimales', () => {
    assert.equal(totalConEnvio({ total: 10.1 }, { costo: 0.2 }), 10.3)
    assert.equal(totalConEnvio({ total: 10 }, null), 10)
    assert.equal(totalConEnvio(null, null), 0)
})

test('errores del servidor: cada campo vuelve a su paso', () => {
    assert.equal(pasoDeLosCampos(['direccion']), 1)
    assert.equal(pasoDeLosCampos(['modalidadEntrega', 'metodoPago']), 1)
    assert.equal(pasoDeLosCampos(['datosTarjeta']), 2)
    assert.equal(pasoDeLosCampos(['otro']), null)
    assert.equal(pasoDeLosCampos(), null)
    assert.deepEqual(camposDelPago(['datosTarjeta', 'metodoPago']), ['numeroTarjeta', 'metodoPago'])
})

test('otros datos: últimos dígitos y nombre del método', () => {
    assert.equal(ultimosDigitos('4111 1111 1111 1234'), '1234')
    assert.equal(nombreDelMetodo('sinpe_movil'), 'SINPE Móvil')
    assert.equal(nombreDelMetodo('otro'), 'otro')
})
