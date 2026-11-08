// Reglas y cuentas de la pantalla «Ventas» del panel (HU-09).

import { CANTIDAD_MAXIMA } from './carrito.js'
import { CANALES } from './pedidosAdmin.js'
import { reglasTelefono } from './reglasCliente.js'

const opcion = ([value, label]) => ({ value, label })

// La tienda en línea tiene su propio flujo; aquí entra todo lo demás
export const CANALES_DE_VENTA = Object.entries(CANALES).filter(([canal]) => canal !== 'web').map(opcion)

// Se cobran en el momento, por eso son los únicos que acepta el servidor
export const METODOS_DE_PAGO_DE_VENTA = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'datafono', label: 'Datáfono' },
    { value: 'sinpe_movil', label: 'SINPE Móvil' },
]

export const nombreDelMetodoDeVenta = (metodo) =>
    METODOS_DE_PAGO_DE_VENTA.find(({ value }) => value === metodo)?.label ?? metodo

export const VENTA_VACIA = {
    correoCliente: '', nombre: '', telefono: '', canal: '', modalidadEntrega: '', direccion: '', metodoPago: '',
}

// Con cuenta se elige al cliente; sin cuenta basta el nombre. La dirección solo si la modalidad la necesita.
export function reglasDeVenta({ sinCuenta, exigeDireccion }) {
    return {
        ...(sinCuenta
            ? { nombre: { obligatorio: true }, telefono: reglasTelefono }
            : { correoCliente: { obligatorio: true } }),
        canal: { obligatorio: true },
        modalidadEntrega: { obligatorio: true },
        ...(exigeDireccion && { direccion: { obligatorio: true } }),
        metodoPago: { obligatorio: true },
    }
}

const redondear = (monto) => Math.round((monto + Number.EPSILON) * 100) / 100

export const subtotalDeLinea = ({ precioFinal, cantidad }) => redondear(precioFinal * cantidad)

// Con impuesto y envío, igual que lo calcula el servidor
export const totalDeLaVenta = (lineas, costoEntrega = 0) =>
    redondear(lineas.reduce((suma, linea) => suma + subtotalDeLinea(linea), 0) + costoEntrega)

// Con contrapedido se puede vender más de lo que hay, pero las existencias no bajan de 0
export const unidadesQueQuedan = ({ existencias, cantidad }) => Math.max(0, existencias - cantidad)

export const textoDeUnidades = (unidades) => `${unidades} ${unidades === 1 ? 'unidad' : 'unidades'}`

// Agrega a la venta en curso; si el producto ya estaba, suma las cantidades.
// Devuelve las líneas nuevas, o `problema` si no se puede.
export function agregarALaVenta(lineas, producto, cantidad) {
    const existente = lineas.find(({ sku }) => sku === producto.sku)
    const total = (existente?.cantidad ?? 0) + cantidad

    if (total > CANTIDAD_MAXIMA) return { problema: `La cantidad máxima por producto es ${CANTIDAD_MAXIMA}.` }
    if (!producto.admiteContrapedido && total > producto.existencias) {
        return {
            problema: existente
                ? `Solo hay ${textoDeUnidades(producto.existencias)} y ya van ${existente.cantidad} en la venta.`
                : `Solo hay ${textoDeUnidades(producto.existencias)}.`,
        }
    }

    if (existente) {
        return { lineas: lineas.map((linea) => (linea.sku === producto.sku ? { ...linea, cantidad: total } : linea)) }
    }
    const { sku, nombre, precioFinal, existencias } = producto
    return { lineas: [...lineas, { sku, nombre, precioFinal, existencias, cantidad }] }
}

// Lo que recibe POST /api/pedidos/admin
export function cuerpoDeLaVenta(valores, lineas, { sinCuenta, exigeDireccion }) {
    return {
        ...(sinCuenta
            ? { clienteNuevo: { nombre: valores.nombre.trim(), telefono: valores.telefono.trim() || undefined } }
            : { correoCliente: valores.correoCliente }),
        lineas: lineas.map(({ sku, cantidad }) => ({ sku, cantidad })),
        canal: valores.canal,
        modalidadEntrega: valores.modalidadEntrega,
        direccion: exigeDireccion ? valores.direccion.trim() : undefined,
        metodoPago: valores.metodoPago,
    }
}

// El servidor nombra los campos de alguien sin cuenta con su ruta; el formulario, con el nombre del campo
export function camposDelFormulario(campos = []) {
    const nombres = { 'clienteNuevo.nombre': 'nombre', 'clienteNuevo.telefono': 'telefono' }
    return campos.map((campo) => nombres[campo] ?? campo).filter((campo) => Object.hasOwn(VENTA_VACIA, campo))
}

// «Venta registrada. Quedan 10 unidades.» Con varios productos dice cuántas quedan de cada uno.
export function mensajeDeVenta(lineas) {
    if (lineas.length === 1) {
        const quedan = unidadesQueQuedan(lineas[0])
        return `Venta registrada. ${quedan === 1 ? 'Queda' : 'Quedan'} ${textoDeUnidades(quedan)}.`
    }
    return `Venta registrada. Quedan ${lineas.map((linea) => `${unidadesQueQuedan(linea)} de ${linea.nombre}`).join(', ')}.`
}

// Cruza lo vendido con las alertas de inventario: el umbral lo decide el servidor
export function avisoDeExistenciasBajas(lineas, alertas) {
    const vendidos = new Set(lineas.map(({ sku }) => sku))
    const bajas = alertas.filter(({ sku }) => vendidos.has(sku))
    if (bajas.length === 0) return null

    const detalle = bajas.map(({ nombre, existencias }) => `${existencias} de ${nombre}`).join(', ')
    const unaSola = bajas.length === 1 && bajas[0].existencias === 1
    return `${unaSola ? 'Queda' : 'Quedan'} ${detalle}: se generó una alerta de existencias bajas.`
}
