// Reglas y textos de la pestaña «Bitácora» de Configuración.

import { priceFormat } from '../components/product-card/productFormat.js'
import { movementTypes } from '../pages/merchandise/merchandiseFormat.js'
import { CANALES, ESTADOS } from './pedidosAdmin.js'

// También son las opciones del filtro; son los eventos que guarda el suscriptor de la bitácora del servidor
export const EVENTOS = {
    parametro_modificado: 'Precio o margen modificado',
    estado_producto_cambiado: 'Estado de producto cambiado',
    producto_eliminado: 'Producto eliminado',
    movimiento_registrado: 'Movimiento de inventario',
    existencias_bajas: 'Existencias bajas',
    pedido_confirmado: 'Pedido confirmado',
    estado_pedido_cambiado: 'Estado de pedido cambiado',
    pedido_modificado: 'Pedido modificado',
    pedido_cancelado: 'Pedido cancelado',
    pedido_creado_manual: 'Pedido registrado a mano',
    empleado_creado: 'Empleado creado',
    estado_empleado_cambiado: 'Empleado activado o desactivado',
    acceso_denegado: 'Acceso denegado',
}

const ENTIDADES = {
    pedido: 'Pedido',
    producto: 'Producto',
    familia: 'Familia',
    administrador: 'Empleado',
    ruta: 'Ruta',
}

export const nombreDeEntidad = (entidad) => ENTIDADES[entidad] ?? entidad

const METODOS_DE_PAGO = {
    tarjeta: 'Tarjeta',
    sinpe_movil: 'SINPE Móvil',
    efectivo: 'Efectivo',
    datafono: 'Datáfono',
    contra_entrega: 'Contra entrega',
    credito: 'Crédito',
}

const ETIQUETAS = {
    activo: 'Estado',
    tipo: 'Tipo',
    sku: 'Código',
    costoItem: 'Costo',
    costoUnitario: 'Costo unitario',
    precioUnitario: 'Precio unitario',
    porcentajeImportacion: 'Importación',
    margenGanancia: 'Margen',
    creditoOtorgado: 'Crédito a favor',
    creditoUsado: 'Crédito usado',
    unidadesRepuestas: 'Unidades repuestas',
    existenciasResultantes: 'Existencias',
    metodoPago: 'Medio de pago',
    nombreDestinatario: 'Destinatario',
    sinCuenta: 'Sin cuenta',
    categoria: 'Familia',
    rol: 'Rol',
}

const dinero = (valor) => priceFormat.format(valor)
const porcentaje = (valor) => `${valor} %`
const FORMATOS = {
    costoItem: dinero,
    costoUnitario: dinero,
    precioUnitario: dinero,
    total: dinero,
    creditoOtorgado: dinero,
    creditoUsado: dinero,
    porcentajeImportacion: porcentaje,
    margenGanancia: porcentaje,
    estado: (valor) => ESTADOS[valor] ?? conMayuscula(valor),
    estadoDelProducto: (valor) => conMayuscula(valor),
    activo: (valor) => (valor ? 'Activo' : 'Inactivo'),
    canal: (valor) => CANALES[valor] ?? valor,
    tipo: (valor) => movementTypes[valor]?.label ?? conMayuscula(valor),
    metodoPago: (valor) => METODOS_DE_PAGO[valor] ?? conMayuscula(valor),
    pago: (valor) => conMayuscula(valor),
    unidadesRepuestas: (unidades) => unidades.map(({ sku, cantidad }) => `${cantidad} × ${sku}`).join(', ') || 'Ninguna',
}

// Lo que el evento trae pero la fila ya muestra en sus columnas
const CAMPOS_OMITIDOS = new Set(['fecha', 'correoAdministrador', 'correoUsuario'])

const conMayuscula = (texto) => {
    const frase = String(texto).replace(/_/g, ' ')
    return frase.charAt(0).toUpperCase() + frase.slice(1)
}

// «correoAdministrador» -> «Correo administrador»
const etiquetaDe = (campo) => ETIQUETAS[campo] ?? conMayuscula(campo.replace(/[A-Z]/g, (letra) => ` ${letra.toLowerCase()}`))

function textoDe(campo, valor) {
    if (FORMATOS[campo]) return FORMATOS[campo](valor)
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
    return typeof valor === 'object' ? JSON.stringify(valor) : String(valor)
}

// El valor anterior o nuevo de un registro como filas { etiqueta, texto }; sin nada que mostrar, una lista vacía
export function detalleDelValor(valor) {
    if (valor === null || typeof valor !== 'object') return []
    return Object.entries(valor)
        .filter(([campo, dato]) => dato !== null && dato !== undefined && !CAMPOS_OMITIDOS.has(campo))
        .map(([campo, dato]) => ({ etiqueta: etiquetaDe(campo), texto: textoDe(campo, dato) }))
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/

// Los filtros viven en la URL. Lo que no se reconoce se ignora, para que un enlace viejo no termine en un error.
export function leerConsultaDeBitacora(parametros) {
    const evento = parametros.get('evento') ?? ''
    const fecha = (nombre) => {
        const valor = parametros.get(nombre) ?? ''
        return FECHA.test(valor) && !Number.isNaN(new Date(valor).getTime()) ? valor : ''
    }
    const desde = fecha('desde')
    const hasta = fecha('hasta')
    const pagina = Number(parametros.get('pagina'))
    return {
        evento: Object.hasOwn(EVENTOS, evento) ? evento : '',
        desde,
        // El servidor rechaza un rango al revés
        hasta: desde && hasta && desde > hasta ? '' : hasta,
        pagina: Number.isSafeInteger(pagina) && pagina > 0 ? pagina : 0,
    }
}

// El cambio de una fecha; si deja el rango al revés, quita la otra en vez de terminar en un error
export function cambioDeFecha({ desde, hasta }, campo, valor) {
    if (campo === 'desde') return { desde: valor, ...(valor && hasta && valor > hasta ? { hasta: '' } : {}) }
    return { hasta: valor, ...(valor && desde && desde > valor ? { desde: '' } : {}) }
}
