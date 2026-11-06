import assert from 'node:assert/strict'
import test from 'node:test'
import { diaDeLaSemana, fechaCorta, hoy, semanasDelMes, sumarDias, sumarMeses, tituloDelMes } from './calendario.js'

test('hoy usa la fecha local, no la de UTC', () => {
    // 9 p. m. del 6 de noviembre en cualquier zona: en UTC ya podría ser el 7
    assert.equal(hoy(new Date(2026, 10, 6, 21, 0)), '2026-11-06')
})

test('la semana empieza en lunes', () => {
    assert.equal(diaDeLaSemana('2026-11-02'), 0)
    assert.equal(diaDeLaSemana('2026-11-06'), 4)
    assert.equal(diaDeLaSemana('2026-11-08'), 6)
})

test('sumar días cruza meses y años', () => {
    assert.equal(sumarDias('2026-11-30', 1), '2026-12-01')
    assert.equal(sumarDias('2026-01-01', -1), '2025-12-31')
    assert.equal(sumarDias('2028-02-28', 1), '2028-02-29')
})

test('sumar meses se queda en el último día si el mes es más corto', () => {
    assert.equal(sumarMeses('2026-01-31', 1), '2026-02-28')
    assert.equal(sumarMeses('2028-01-31', 1), '2028-02-29')
    assert.equal(sumarMeses('2026-03-31', -1), '2026-02-28')
    assert.equal(sumarMeses('2026-12-15', 1), '2027-01-15')
    assert.equal(sumarMeses('2026-11-06', -12), '2025-11-06')
})

test('el mes siempre ocupa 6 semanas de lunes a domingo', () => {
    const semanas = semanasDelMes('2026-11-06')
    assert.equal(semanas.length, 6)
    assert.ok(semanas.every((semana) => semana.length === 7))
    // Noviembre de 2026 empieza en domingo: la primera fila trae 6 días de octubre
    assert.deepEqual(semanas[0][0], { fecha: '2026-10-26', delMes: false })
    assert.deepEqual(semanas[0][6], { fecha: '2026-11-01', delMes: true })
    assert.deepEqual(semanas[4][0], { fecha: '2026-11-23', delMes: true })
    assert.deepEqual(semanas[5][1], { fecha: '2026-12-01', delMes: false })
})

test('un mes que empieza en lunes no repite una semana entera del anterior', () => {
    assert.deepEqual(semanasDelMes('2026-06-15')[0][0], { fecha: '2026-06-01', delMes: true })
})

test('los textos no se corren un día por la zona horaria', () => {
    assert.match(fechaCorta('2026-11-06'), /^6 nov.* 2026$/)
    assert.equal(tituloDelMes('2026-11-01'), 'Noviembre de 2026')
})
