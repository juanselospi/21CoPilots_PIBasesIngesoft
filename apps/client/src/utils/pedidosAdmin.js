// Reglas y textos de la pantalla «Pedidos» del panel.

import { priceFormat } from '../components/product-card/productFormat.js'

// «Finalizado» es como el servidor guarda el pedido entregado; en pantalla siempre se lee «Entregado»
export const ESTADOS = {
    colocado: 'Colocado',
    procesado: 'Procesado',
    en_transito: 'En tránsito',
    finalizado: 'Entregado',
    cancelado: 'Cancelado',
    en_disputa: 'En disputa',
}

export const CANALES = {
    web: 'Tienda en línea',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    telefono: 'Teléfono',
    presencial: 'Presencial',
}

export const MODALIDADES = {
    mensajero: 'Mensajero',
    uber_flash: 'Uber Flash',
    correos_cr: 'Correos de Costa Rica',
    entrega_personal: 'Entrega personal',
}

const ETIQUETAS_DE_ACCION = {
    procesado: 'Marcar procesado',
    en_transito: 'Marcar en tránsito',
    finalizado: 'Marcar entregado',
    en_disputa: 'Poner en disputa',
    cancelado: 'Cancelar',
}

// Los botones salen de los estados que el servidor permite, nunca de una lista propia.
// Una disputa se resuelve volviendo al estado anterior, que el servidor manda como siguiente.
export function accionesDelPedido(estado, estadosSiguientes = []) {
    return estadosSiguientes.map((siguiente) => ({
        estado: siguiente,
        etiqueta: siguiente !== 'cancelado' && estado === 'en_disputa'
            ? 'Resolver disputa'
            : ETIQUETAS_DE_ACCION[siguiente] ?? ESTADOS[siguiente] ?? siguiente,
    }))
}

const MOTIVOS_SIN_EDICION = {
    en_transito: 'El pedido ya salió a entrega: sus productos ya no se pueden cambiar.',
    finalizado: 'El pedido ya se entregó: sus productos ya no se pueden cambiar.',
    cancelado: 'El pedido está cancelado: sus productos ya no se pueden cambiar.',
}

// Si se puede editar lo dice el servidor (lineasEditables); esto solo le pone palabras
export const motivoSinEdicion = (estado) =>
    MOTIVOS_SIN_EDICION[estado] ?? 'El estado de este pedido no permite cambiar sus productos.'

const redondear = (monto) => Math.round((monto + Number.EPSILON) * 100) / 100

// Lo que se pagó por unidad, con impuesto; es la misma cuenta con la que el servidor revisa un reemplazo
export const precioPagado = ({ precioUnitario, tasaImpuesto }) => redondear(precioUnitario * (1 + tasaImpuesto / 100))

// El precio del producto con esa misma cuenta: el precio final del catálogo puede diferir por un centavo
export function precioParaComparar({ desglosePrecio, tasaImpuesto }) {
    const precioUnitario = desglosePrecio.find(({ paso }) => paso === 'margen')?.monto ?? 0
    return precioPagado({ precioUnitario, tasaImpuesto })
}

// Lo que el buscador del pedido deja elegir: sin lo que ya está en el pedido, sin lo que no se puede
// vender y, en un reemplazo, sin lo que cueste más que lo pagado.
export function productosElegibles(productos, lineas, precioMaximo = null) {
    const enElPedido = new Set(lineas.map(({ sku }) => sku))
    return productos.filter((producto) =>
        !enElPedido.has(producto.sku)
        && producto.disponibilidad !== 'no_disponible'
        && (precioMaximo === null || precioParaComparar(producto) <= precioMaximo))
}

// El tope para pedirle al servidor: un centavo de más, y lo exacto lo decide productosElegibles
export const topeDeBusqueda = (precioMaximo) => (precioMaximo + 0.01).toFixed(2)

// El crédito que dejó un cambio: lo acumulado después menos lo de antes
export const creditoNuevo = (antes, despues) => redondear(despues.creditoOtorgado - antes.creditoOtorgado)

export const estaPagado = (pedido) => pedido.pagos.some(({ estadoPago }) => estadoPago === 'aprobado')

// «2 × Halcón, 1 × Set de cartas y 3 más»
export function resumenDeProductos(productos, visibles = 2) {
    const texto = productos.slice(0, visibles).map(({ nombre, cantidad }) => `${cantidad} × ${nombre}`).join(', ')
    const resto = productos.length - visibles
    return resto > 0 ? `${texto} y ${resto} más` : texto
}

const nombreDelEstado = (estado) => ESTADOS[estado] ?? estado

function describirEdicion(anterior, nuevo) {
    if (anterior?.sku && nuevo?.sku) {
        return anterior.sku === nuevo.sku
            ? `${nuevo.sku}: cantidad de ${anterior.cantidad} a ${nuevo.cantidad}`
            : `${anterior.sku} reemplazado por ${nuevo.sku}`
    }
    if (nuevo?.sku) return `Se agregó ${nuevo.sku} (cantidad ${nuevo.cantidad})`
    if (anterior?.sku) return `Se quitó ${anterior.sku} (cantidad ${anterior.cantidad})`
    return 'Se modificó el pedido'
}

// Cada registro de la bitácora del pedido, en palabras
export function describirCambio({ evento, valorAnterior, valorNuevo }) {
    switch (evento) {
        case 'pedido_confirmado':
            return 'El cliente confirmó el pedido'
        case 'pedido_creado_manual':
            return `Pedido registrado a mano, canal ${CANALES[valorNuevo?.canal] ?? valorNuevo?.canal}`
        case 'estado_pedido_cambiado':
            return `Estado: de ${nombreDelEstado(valorAnterior?.estado)} a ${nombreDelEstado(valorNuevo?.estado)}`
        case 'pedido_cancelado': {
            const unidades = (valorNuevo?.unidadesRepuestas ?? []).reduce((suma, { cantidad }) => suma + cantidad, 0)
            return `Pedido cancelado: ${unidades} ${unidades === 1 ? 'unidad vuelve' : 'unidades vuelven'} al inventario${conCredito(valorNuevo)}`
        }
        case 'pedido_modificado':
            return `${describirEdicion(valorAnterior, valorNuevo)}${conCredito(valorNuevo)}`
        default:
            return evento
    }
}

function conCredito(valor) {
    return valor?.creditoOtorgado > 0 ? `; crédito a favor de ${priceFormat.format(valor.creditoOtorgado)}` : ''
}

// Los filtros viven en la URL: así la flecha del detalle vuelve a la misma lista.
// Lo que no se reconoce se ignora, para que un enlace viejo no termine en un error.
export function leerConsulta(parametros) {
    const opcion = (nombre, permitidas) => (Object.hasOwn(permitidas, parametros.get(nombre) ?? '') ? parametros.get(nombre) : '')
    const pagina = Number(parametros.get('pagina'))
    return {
        q: parametros.get('q')?.trim() ?? '',
        estado: opcion('estado', ESTADOS),
        canal: opcion('canal', CANALES),
        pagina: Number.isSafeInteger(pagina) && pagina > 0 ? pagina : 0,
    }
}

// Otra búsqueda u otro filtro empiezan en la primera página
export function conCambios(parametros, cambios) {
    const siguiente = new URLSearchParams(parametros)
    if (!Object.hasOwn(cambios, 'pagina')) siguiente.delete('pagina')
    for (const [nombre, valor] of Object.entries(cambios)) {
        if (valor) siguiente.set(nombre, valor)
        else siguiente.delete(nombre)
    }
    return siguiente
}

// El número buscado, sin el #, o null si lo escrito no es un número
export function numeroBuscado(q) {
    return /^#?\d+$/.test(q) ? q.replace('#', '') : null
}
