// Reglas y cuentas de los pasos para finalizar la compra

export const METODOS_DE_PAGO = [
    { metodo: 'tarjeta', nombre: 'Tarjeta' },
    { metodo: 'sinpe_movil', nombre: 'SINPE Móvil' },
    { metodo: 'contra_entrega', nombre: 'Contra entrega' },
]

// El credito no se escoge como los demas: se marca aparte y cubre todo o una parte
const nombreDeMetodo = {
    ...Object.fromEntries(METODOS_DE_PAGO.map(({ metodo, nombre }) => [metodo, nombre])),
    credito: 'Crédito a favor',
}
export const nombreDelMetodo = (metodo) => nombreDeMetodo[metodo] ?? metodo

export const ENTREGA_VACIA = { modalidadEntrega: '', direccion: '' }
export const PAGO_VACIO = { metodoPago: '', numeroTarjeta: '', vencimiento: '', cvv: '', usarCredito: false }

const redondear = (monto) => Math.round((monto + Number.EPSILON) * 100) / 100

// Cuanto del saldo a favor se usa: todo el saldo, o solo el total si el saldo alcanza para mas
export function creditoQueSeUsa(pago, saldo, total) {
    if (!pago.usarCredito || !(saldo > 0)) return 0
    return redondear(Math.min(saldo, total))
}

// Lo que falta despues del credito y se cobra con el medio de pago
export const restantePorPagar = (total, creditoUsado) => redondear(total - creditoUsado)

// Lo que hay que llenar en la entrega. La direccion solo se pide si la modalidad la necesita
export function reglasDeEntrega(modalidad) {
    const reglas = { modalidadEntrega: { obligatorio: true } }
    if (modalidad?.exigeDireccion) reglas.direccion = { obligatorio: true }
    return reglas
}

// La tarjeta sirve hasta el ultimo dia del mes que trae impreso
export function tarjetaVencida(vencimiento, hoy = new Date()) {
    const [mes, anno] = vencimiento.split('/').map(Number)
    const primerDiaDespues = new Date(2000 + anno, mes, 1)
    return hoy >= primerDiaDespues
}

// Lo que hay que llenar en el pago, los datos de la tarjeta solo si se paga con tarjeta.
// Si el credito cubre todo no hace falta ningun medio de pago
export function reglasDePago(metodoPago, hoy = new Date(), { creditoCubreTodo = false } = {}) {
    if (creditoCubreTodo) return {}
    const reglas = { metodoPago: { obligatorio: true } }
    if (metodoPago !== 'tarjeta') return reglas

    return {
        ...reglas,
        numeroTarjeta: {
            obligatorio: true,
            // Con o sin espacios o guiones entre los digitos, igual se limpian antes de enviarlo
            patron: /^(?:\d[ -]?){12,19}$/,
            mensajePatron: 'Ingrese de 12 a 19 dígitos.',
        },
        vencimiento: {
            obligatorio: true,
            patron: /^(0[1-9]|1[0-2])\/\d{2}$/,
            mensajePatron: 'Ingrese el mes y el año, por ejemplo 08/29.',
            comprobar: (valor) => (tarjetaVencida(valor, hoy) ? 'Esta tarjeta ya venció.' : null),
        },
        cvv: {
            obligatorio: true,
            patron: /^\d{3,4}$/,
            mensajePatron: 'Ingrese los 3 o 4 dígitos de atrás de la tarjeta.',
        },
    }
}

const soloDigitos = (texto) => texto.replace(/\D/g, '')

export const ultimosDigitos = (numeroTarjeta) => soloDigitos(numeroTarjeta).slice(-4)

// Pone la barra del vencimiento mientras se escribe: 0829 -> 08/29
export function formatoVencimiento(texto) {
    const digitos = soloDigitos(texto).slice(0, 4)
    return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos
}

// Lo que se le manda al servidor. El vencimiento y el CVV se revisan aqui y no salen del navegador
// porque el servidor no los usa, y de la tarjeta nunca se guarda nada.
// Si el credito cubre todo no va medio de pago: el servidor lo aprueba sin pasarela
export function cuerpoDeConfirmacion(entrega, pago, modalidad, { creditoCubreTodo = false } = {}) {
    const metodoPago = creditoCubreTodo ? null : pago.metodoPago
    return {
        modalidadEntrega: entrega.modalidadEntrega,
        direccion: modalidad?.exigeDireccion ? entrega.direccion.trim() : null,
        metodoPago,
        datosTarjeta: metodoPago === 'tarjeta' ? { numero: soloDigitos(pago.numeroTarjeta) } : null,
        usarCredito: Boolean(pago.usarCredito),
    }
}

// El envio se suma a lo del carrito, igual que hace el servidor al confirmar
export function totalConEnvio(carrito, modalidad) {
    return redondear((carrito?.total ?? 0) + (modalidad?.costo ?? 0))
}

// El servidor marca los datos de la tarjeta como un solo campo -> se muestra en el numero
export const camposDelPago = (campos = []) =>
    campos.map((campo) => (campo === 'datosTarjeta' ? 'numeroTarjeta' : campo))

const PASO_ENTREGA = 1
const PASO_PAGO = 2

// A que paso hay que volver para corregir lo que rechazo el servidor, null si no es de ningun paso
export function pasoDeLosCampos(campos = []) {
    if (campos.some((campo) => campo === 'modalidadEntrega' || campo === 'direccion')) return PASO_ENTREGA
    if (campos.some((campo) => ['metodoPago', 'datosTarjeta', 'usarCredito'].includes(campo))) return PASO_PAGO
    return null
}
