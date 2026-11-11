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
            comprobar: problemaDelNumero,
        },
        vencimiento: {
            obligatorio: true,
            patron: /^(0[1-9]|1[0-2])\/\d{2}$/,
            mensajePatron: 'Ingrese el mes y el año, por ejemplo 08/29.',
            comprobar: (valor) => (tarjetaVencida(valor, hoy) ? 'Esta tarjeta ya venció.' : null),
        },
        cvv: {
            obligatorio: true,
            comprobar: (valor, valores) => problemaDelCvv(valor, marcaDeTarjeta(valores.numeroTarjeta)),
        },
    }
}

const soloDigitos = (texto) => texto.replace(/\D/g, '')

const NOMBRE_DE_MARCA = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express' }
export const nombreDeMarca = (marca) => NOMBRE_DE_MARCA[marca] ?? null

// La marca sale de como empieza el numero. null si no es ninguna de las que se reconocen
export function marcaDeTarjeta(numero = '') {
    const digitos = soloDigitos(numero)
    if (/^3[47]/.test(digitos)) return 'amex'
    if (/^4/.test(digitos)) return 'visa'
    const primeros = Number(digitos.slice(0, 4))
    if (/^5[1-5]/.test(digitos) || (digitos.length >= 4 && primeros >= 2221 && primeros <= 2720)) return 'mastercard'
    return null
}

// Cuantos digitos lleva el numero de cada marca. Si no se reconoce se acepta de 12 a 19
const LARGO_DEL_NUMERO = { visa: 16, mastercard: 16, amex: 15 }
const LARGO_MINIMO = 12
const LARGO_MAXIMO = 19
export const largoDeLaTarjeta = (marca) => LARGO_DEL_NUMERO[marca] ?? LARGO_MAXIMO

// Mientras se escribe: solo digitos, hasta los que lleva la marca y en grupos de 4
export function formatoTarjeta(texto) {
    const digitos = soloDigitos(texto)
    return digitos.slice(0, largoDeLaTarjeta(marcaDeTarjeta(digitos))).replace(/(\d{4})(?=\d)/g, '$1 ')
}

// Cuantos caracteres ocupa ya formateado, con los espacios entre grupos
export const largoConEspacios = (marca) => {
    const digitos = largoDeLaTarjeta(marca)
    return digitos + Math.ceil(digitos / 4) - 1
}

export function problemaDelNumero(numero) {
    const digitos = soloDigitos(numero)
    if (/[^\d\s-]/.test(numero)) return 'El número de la tarjeta solo lleva dígitos.'
    const marca = marcaDeTarjeta(digitos)
    const largo = LARGO_DEL_NUMERO[marca]
    if (largo && digitos.length !== largo) return `Las tarjetas ${nombreDeMarca(marca)} llevan ${largo} dígitos.`
    if (!largo && (digitos.length < LARGO_MINIMO || digitos.length > LARGO_MAXIMO)) {
        return `Ingrese de ${LARGO_MINIMO} a ${LARGO_MAXIMO} dígitos.`
    }
    return null
}

// El CVV solo acepta digitos y no deja escribir mas de los que lleva la marca
export const formatoCvv = (texto, marca) => soloDigitos(texto).slice(0, largoDelCvv(marca) ?? 4)

// Cuantos digitos lleva el CVV: American Express trae 4 al frente, Visa y Mastercard 3 atras
export const largoDelCvv = (marca) => (marca === 'amex' ? 4 : marca ? 3 : null)

export function problemaDelCvv(cvv, marca) {
    const largo = largoDelCvv(marca)
    if (largo === 4 && !/^\d{4}$/.test(cvv)) return 'Las American Express llevan 4 dígitos al frente de la tarjeta.'
    if (largo === 3 && !/^\d{3}$/.test(cvv)) return 'Ingrese los 3 dígitos de atrás de la tarjeta.'
    if (!largo && !/^\d{3,4}$/.test(cvv)) return 'Ingrese los 3 o 4 dígitos de atrás de la tarjeta.'
    return null
}

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
