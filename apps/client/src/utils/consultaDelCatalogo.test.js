import assert from 'node:assert/strict'
import test from 'node:test'
import { leerConsultaDelCatalogo, parametrosDelCatalogo, textoDeResultados } from './consultaDelCatalogo.js'

const leer = (consulta, opciones) => leerConsultaDelCatalogo(new URLSearchParams(consulta), opciones)

test('sin parámetros quedan los valores por defecto', () => {
    assert.deepEqual(leer(''), {
        q: '', categoria: '', disponibilidad: '', precioMin: '', precioMax: '', orden: 'nombre', pagina: 0,
    })
})

test('lee la búsqueda, los filtros, el orden y la página (que en la URL empieza en 1)', () => {
    assert.deepEqual(
        leer('q=lego&categoria=Legos&disponibilidad=en_existencia&precioMin=50&precioMax=120.5&orden=-precio&pagina=3'),
        { q: 'lego', categoria: 'Legos', disponibilidad: 'en_existencia', precioMin: '50', precioMax: '120.5', orden: '-precio', pagina: 2 },
    )
})

test('lo inválido se ignora en vez de romper la página', () => {
    const consulta = leer('disponibilidad=descontinuado&precioMin=-5&precioMax=abc&orden=existencias&pagina=0')
    assert.equal(consulta.disponibilidad, '')
    assert.equal(consulta.precioMin, '')
    assert.equal(consulta.precioMax, '')
    assert.equal(consulta.orden, 'nombre')
    assert.equal(consulta.pagina, 0)
    assert.equal(leer('pagina=-2').pagina, 0)
    assert.equal(leer('pagina=2.5').pagina, 0)
})

test('un rango de precio al revés conserva solo el mínimo', () => {
    const consulta = leer('precioMin=100&precioMax=10')
    assert.equal(consulta.precioMin, '100')
    assert.equal(consulta.precioMax, '')
})

test('dentro de una categoría se ignora el filtro de categoría', () => {
    assert.equal(leer('categoria=Legos', { conCategoria: false }).categoria, '')
})

test('los parámetros omiten los valores por defecto y vuelven a leerse igual', () => {
    const consulta = { q: 'lego', categoria: '', disponibilidad: '', precioMin: '50', precioMax: '', orden: 'precio', pagina: 2 }
    const parametros = parametrosDelCatalogo(consulta)
    assert.equal(parametros.toString(), 'q=lego&precioMin=50&orden=precio&pagina=3')
    assert.deepEqual(leerConsultaDelCatalogo(parametros), consulta)
    assert.equal(parametrosDelCatalogo({ ...consulta, q: '', precioMin: '', orden: 'nombre', pagina: 0 }).toString(), '')
})

test('el texto de resultados usa el rango real de la página', () => {
    assert.equal(textoDeResultados(0, 199), 'Mostrando 1–12 de 199 productos')
    assert.equal(textoDeResultados(16, 199), 'Mostrando 193–199 de 199 productos')
    assert.equal(textoDeResultados(0, 1), 'Mostrando 1–1 de 1 producto')
    assert.equal(textoDeResultados(0, 0), 'Sin resultados')
})
