// Cuentas del calendario del panel. Las fechas viajan como texto 'AAAA-MM-DD', igual que en la URL y en
// la API, y se calcula en hora local: con new Date('2026-11-06') sería UTC y aquí daría el día anterior.

const aFecha = (texto) => {
    const [anio, mes, dia] = texto.split('-').map(Number)
    return new Date(anio, mes - 1, dia)
}

const aTexto = (fecha) => [
    String(fecha.getFullYear()).padStart(4, '0'),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0'),
].join('-')

export const hoy = (ahora = new Date()) => aTexto(ahora)

// 0 es lunes y 6 es domingo: en Costa Rica la semana del calendario empieza en lunes
export const diaDeLaSemana = (texto) => (aFecha(texto).getDay() + 6) % 7

export function sumarDias(texto, dias) {
    const fecha = aFecha(texto)
    fecha.setDate(fecha.getDate() + dias)
    return aTexto(fecha)
}

// Del 31 de enero, un mes después es el último día de febrero
export function sumarMeses(texto, meses) {
    const fecha = aFecha(texto)
    const dia = fecha.getDate()
    fecha.setDate(1)
    fecha.setMonth(fecha.getMonth() + meses)
    const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate()
    fecha.setDate(Math.min(dia, ultimoDia))
    return aTexto(fecha)
}

// Siempre 6 semanas, para que el calendario no cambie de alto entre un mes y otro
export function semanasDelMes(texto) {
    const primero = `${texto.slice(0, 7)}-01`
    const inicio = sumarDias(primero, -diaDeLaSemana(primero))
    return Array.from({ length: 6 }, (_, semana) =>
        Array.from({ length: 7 }, (_, dia) => {
            const fecha = sumarDias(inicio, semana * 7 + dia)
            return { fecha, delMes: fecha.slice(0, 7) === texto.slice(0, 7) }
        }),
    )
}

const conFormato = (opciones) => {
    const formato = new Intl.DateTimeFormat('es-CR', opciones)
    return (texto) => formato.format(aFecha(texto))
}

// «6 nov 2026», en el campo
export const fechaCorta = conFormato({ day: 'numeric', month: 'short', year: 'numeric' })
// «viernes, 6 de noviembre de 2026», para el lector de pantalla
export const fechaLarga = conFormato({ dateStyle: 'full' })

const mesConAnio = conFormato({ month: 'long', year: 'numeric' })
// «Noviembre de 2026»
export const tituloDelMes = (texto) => {
    const titulo = mesConAnio(texto)
    return titulo.charAt(0).toUpperCase() + titulo.slice(1)
}
