import assert from 'node:assert/strict'
import test from 'node:test'
import {
    accionesDelPedido, conCambios, creditoNuevo, describirCambio, estaPagado, leerConsulta, motivoSinEdicion,
    numeroBuscado, precioPagado, precioParaComparar, productosElegibles, resumenDeProductos, topeDeBusqueda,
} from './pedidosAdmin.js'

const producto = (sku, margen, extra = {}) => ({
    sku,
    disponibilidad: 'en_existencia',
    tasaImpuesto: 13,
    desglosePrecio: [{ paso: 'costo', monto: 1 }, { paso: 'margen', monto: margen }, { paso: 'impuesto', monto: 999 }],
    ...extra,
})

test('el precio pagado lleva impuesto y se redondea a centavos', () => {
    assert.equal(precioPagado({ precioUnitario: 100, tasaImpuesto: 13 }), 113)
    assert.equal(precioPagado({ precioUnitario: 71.98, tasaImpuesto: 13 }), 81.34)
    assert.equal(precioPagado({ precioUnitario: 100, tasaImpuesto: 0 }), 100)
})

test('un producto se compara con la misma cuenta que lo pagado, no con el último paso del desglose', () => {
    assert.equal(precioParaComparar(producto('A', 100)), 113)
})

test('el buscador deja fuera lo que ya está en el pedido y lo que no se puede vender', () => {
    const productos = [producto('A', 10), producto('B', 10), producto('C', 10, { disponibilidad: 'no_disponible' }),
        producto('D', 10, { disponibilidad: 'por_contrapedido' })]
    assert.deepEqual(productosElegibles(productos, [{ sku: 'A' }]).map(({ sku }) => sku), ['B', 'D'])
})

test('un reemplazo admite igual o menor precio, nunca mayor', () => {
    const productos = [producto('IGUAL', 100), producto('MENOR', 50), producto('MAYOR', 100.01)]
    assert.deepEqual(productosElegibles(productos, [], 113).map(({ sku }) => sku), ['IGUAL', 'MENOR'])
})

test('el tope de la búsqueda da un centavo de margen y lo exacto se revisa después', () => {
    assert.equal(topeDeBusqueda(113), '113.01')
    assert.equal(topeDeBusqueda(81.34), '81.35')
})

test('cada estado sin edición dice su motivo', () => {
    assert.match(motivoSinEdicion('en_transito'), /salió a entrega/)
    assert.match(motivoSinEdicion('finalizado'), /se entregó/)
    assert.match(motivoSinEdicion('cancelado'), /cancelado/)
    assert.match(motivoSinEdicion('otro'), /no permite/)
})

test('el crédito nuevo es lo que aumentó con el cambio', () => {
    assert.equal(creditoNuevo({ creditoOtorgado: 10.1 }, { creditoOtorgado: 30.3 }), 20.2)
    assert.equal(creditoNuevo({ creditoOtorgado: 5 }, { creditoOtorgado: 5 }), 0)
})

test('un pedido está pagado si tiene algún pago aprobado', () => {
    assert.equal(estaPagado({ pagos: [{ estadoPago: 'rechazado' }, { estadoPago: 'aprobado' }] }), true)
    assert.equal(estaPagado({ pagos: [{ estadoPago: 'pendiente' }] }), false)
    assert.equal(estaPagado({ pagos: [] }), false)
})

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
