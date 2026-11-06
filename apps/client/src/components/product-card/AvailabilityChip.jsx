import { CircleCheck, CircleX, Clock } from 'lucide-react'
import { availabilityLabels } from './productFormat.js'

const chipByAvailability = {
    'in-stock': { className: 'chip chip-ok', Icon: CircleCheck },
    'backorder': { className: 'chip chip-aviso', Icon: Clock },
    // Este solo sale en el carrito, el catalogo no muestra productos fuera de stock
    'out-of-stock': { className: 'chip chip-error', Icon: CircleX },
}

// Disponibilidad de la tarjeta, de la ficha y de las lineas del carrito, con palabra e icono y no solo color
function AvailabilityChip({ availability }) {
    const { className, Icon } = chipByAvailability[availability]

    return (
        <span className={className}>
            <Icon size={16} />
            {availabilityLabels[availability]}
        </span>
    )
}

export default AvailabilityChip
