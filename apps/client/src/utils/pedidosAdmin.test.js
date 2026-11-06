import assert from 'node:assert/strict'
import test from 'node:test'
import {
    accionesDelPedido, conCambios, describirCambio, leerConsulta, numeroBuscado, resumenDeProductos,
} from './pedidosAdmin.js'

const etiquetas = (estado, siguientes) => accionesDelPedido(estado, siguientes).map(({ etiqueta }) => etiqueta)

test('los botones siguen los estados que permite el servidor', () => {
    assert.deepEqual(etiquetas('colocado', ['procesado', 'cancelado', 'en_disputa']), ['Marcar procesado', 'Cancelar', 'Poner en disputa'])
    assert.deepEqual(etiquetas('procesado', ['en_transito', 'cancelado', 'en_disputa']), ['Marcar en tránsito', 'Cancelar', 'Poner en disputa'])
    assert.deepEqual(etiquetas('en_transito', ['finalizado', 'en_disputa']), ['Marcar entregado', 'Poner en disputa'])
    assert.deepEqual(etiquetas('finalizado', []), [])
})

test('una disputa se resuelve volviendo al estado anterior y solo se cancela si el servidor lo permite', () => {
    assert.deepEqual(accionesDelPedido('en_disputa', ['procesado', 'cancelado']), [
        { estado: 'procesado', etiqueta: 'Resolver disputa' },
        { estado: 'cancelado', etiqueta: 'Cancelar' },
    ])
    assert.deepEqual(etiquetas('en_disputa', ['en_transito']), ['Resolver disputa'])
})

test('el resumen muestra los primeros productos y cuenta los demás', () => {
    const productos = [
        { nombre: 'Halcón', cantidad: 2 },
        { nombre: 'Set', cantidad: 1 },
        { nombre: 'Sobre', cantidad: 5 },
    ]
    assert.equal(resumenDeProductos(productos.slice(0, 1)), '2 × Halcón')
    assert.equal(resumenDeProductos(productos.slice(0, 2)), '2 × Halcón, 1 × Set')
    assert.equal(resumenDeProductos(productos), '2 × Halcón, 1 × Set y 1 más')
})

test('la bitácora se describe en palabras y «finalizado» se lee «Entregado»', () => {
    assert.equal(
        describirCambio({ evento: 'estado_pedido_cambiado', valorAnterior: { estado: 'en_transito' }, valorNuevo: { estado: 'finalizado' } }),
        'Estado: En tránsito → Entregado',
    )
    assert.equal(describirCambio({ evento: 'pedido_confirmado', valorAnterior: null, valorNuevo: {} }), 'El cliente confirmó el pedido')
    assert.equal(describirCambio({ evento: 'pedido_creado_manual', valorNuevo: { canal: 'whatsapp' } }), 'Pedido registrado a mano, canal WhatsApp')
    assert.equal(describirCambio({ evento: 'otro_evento' }), 'otro_evento')
})

test('la cancelación suma las unidades que volvieron al inventario', () => {
    const texto = describirCambio({
        evento: 'pedido_cancelado',
        valorNuevo: { unidadesRepuestas: [{ sku: 'A', cantidad: 2 }, { sku: 'B', cantidad: 1 }], creditoOtorgado: 0 },
    })
    assert.equal(texto, 'Pedido cancelado: 3 unidades vuelven al inventario')
})

test('las ediciones distinguen cantidad, reemplazo, agregar y quitar', () => {
    const editar = (valorAnterior, valorNuevo) => describirCambio({ evento: 'pedido_modificado', valorAnterior, valorNuevo })
    assert.equal(editar({ sku: 'A', cantidad: 1 }, { sku: 'A', cantidad: 3 }), 'A: cantidad de 1 a 3')
    assert.equal(editar({ sku: 'A', cantidad: 1 }, { sku: 'B', cantidad: 1 }), 'A reemplazado por B')
    assert.equal(editar(null, { sku: 'B', cantidad: 2 }), 'Se agregó B (cantidad 2)')
    assert.equal(editar({ sku: 'A', cantidad: 1 }, null), 'Se quitó A (cantidad 1)')
    assert.match(editar({ sku: 'A', cantidad: 1 }, { creditoOtorgado: 5 }), /^Se quitó A \(cantidad 1\); crédito a favor de /)
})

test('la consulta ignora lo que no reconoce en la URL', () => {
    const leer = (texto) => leerConsulta(new URLSearchParams(texto))
    assert.deepEqual(leer('q=%20ana%20&estado=colocado&canal=web&pagina=2'), { q: 'ana', estado: 'colocado', canal: 'web', pagina: 2 })
    assert.deepEqual(leer('estado=perdido&canal=fax&pagina=-1'), { q: '', estado: '', canal: '', pagina: 0 })
    assert.deepEqual(leer('estado=toString&pagina=abc'), { q: '', estado: '', canal: '', pagina: 0 })
})

test('cambiar un filtro vuelve a la primera página; cambiar de página conserva los filtros', () => {
    const actual = new URLSearchParams('estado=colocado&pagina=3')
    assert.equal(conCambios(actual, { canal: 'web' }).toString(), 'estado=colocado&canal=web')
    assert.equal(conCambios(actual, { estado: '' }).toString(), '')
    assert.equal(conCambios(actual, { pagina: 4 }).toString(), 'estado=colocado&pagina=4')
    assert.equal(conCambios(actual, { pagina: 0 }).toString(), 'estado=colocado')
})

test('solo cuenta como número lo que tiene únicamente dígitos, con # opcional', () => {
    assert.equal(numeroBuscado('1099'), '1099')
    assert.equal(numeroBuscado('#1099'), '1099')
    assert.equal(numeroBuscado('ana'), null)
    assert.equal(numeroBuscado('P-1099'), null)
})
