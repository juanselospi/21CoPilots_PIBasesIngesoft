import { CircleCheck, CircleDot, CircleX, Clock, CreditCard, PackageCheck, TriangleAlert, Truck } from 'lucide-react'
import { ESTADOS } from '../../utils/pedidosAdmin.js'

// Un chip siempre lleva palabra e icono, nunca solo el color
const estadoChips = {
    colocado: { className: 'chip', Icon: CircleDot },
    procesado: { className: 'chip chip-info', Icon: PackageCheck },
    en_transito: { className: 'chip chip-aviso', Icon: Truck },
    finalizado: { className: 'chip chip-ok', Icon: CircleCheck },
    cancelado: { className: 'chip chip-error', Icon: CircleX },
    en_disputa: { className: 'chip chip-error', Icon: TriangleAlert },
}

const pagoChips = {
    aprobado: { label: 'Pagado', className: 'chip chip-ok', Icon: CircleCheck },
    pendiente: { label: 'Pago pendiente', className: 'chip chip-aviso', Icon: Clock },
    rechazado: { label: 'Pago rechazado', className: 'chip chip-error', Icon: CircleX },
}
const sinPago = { label: 'Sin pago', className: 'chip', Icon: CreditCard }

export function OrderStatusChip({ estado }) {
    const { className, Icon } = estadoChips[estado] ?? estadoChips.colocado
    return <span className={className}><Icon size={16} aria-hidden='true' />{ESTADOS[estado] ?? estado}</span>
}

export function PaymentStatusChip({ estadoPago }) {
    const { label, className, Icon } = pagoChips[estadoPago] ?? sinPago
    return <span className={className}><Icon size={16} aria-hidden='true' />{label}</span>
}
