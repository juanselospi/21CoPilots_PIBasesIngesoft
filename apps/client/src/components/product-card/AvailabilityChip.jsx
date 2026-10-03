import { CircleCheck, Clock } from 'lucide-react'
import { availabilityLabels } from './productFormat.js'

const chipByAvailability = {
    'in-stock': { className: 'chip chip-ok', Icon: CircleCheck },
    'backorder': { className: 'chip chip-aviso', Icon: Clock },
}

// Disponibilidad de la tarjeta y de la ficha, con palabra e icono y no solo color
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
