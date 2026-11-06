import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import './DateField.css'
import {
    diaDeLaSemana, fechaCorta, fechaLarga, hoy, semanasDelMes, sumarDias, sumarMeses, tituloDelMes,
} from '../../utils/calendario.js'

const weekdays = [
    ['Lu', 'lunes'], ['Ma', 'martes'], ['Mi', 'miércoles'], ['Ju', 'jueves'], ['Vi', 'viernes'], ['Sá', 'sábado'], ['Do', 'domingo'],
]

// Teclas de la cuadrícula: a qué fecha mueven desde la actual
const movesByKey = {
    ArrowLeft: (date) => sumarDias(date, -1),
    ArrowRight: (date) => sumarDias(date, 1),
    ArrowUp: (date) => sumarDias(date, -7),
    ArrowDown: (date) => sumarDias(date, 7),
    Home: (date) => sumarDias(date, -diaDeLaSemana(date)),
    End: (date) => sumarDias(date, 6 - diaDeLaSemana(date)),
    PageUp: (date, event) => sumarMeses(date, event.shiftKey ? -12 : -1),
    PageDown: (date, event) => sumarMeses(date, event.shiftKey ? 12 : 1),
}

// El contenido solo existe mientras está abierto: cada vez arranca en la fecha elegida o en hoy
function Calendar({ value, onSelect }) {
    const today = hoy()
    const [cursor, setCursor] = useState(value || today)
    const gridRef = useRef(null)
    // Al abrir y con el teclado el foco sigue al día; con las flechas del encabezado se queda en ellas
    const focusDay = useRef(true)

    useEffect(() => {
        if (!focusDay.current) return
        focusDay.current = false
        gridRef.current?.querySelector('[tabindex="0"]')?.focus()
    }, [cursor])

    const handleKeyDown = (event) => {
        const move = movesByKey[event.key]
        if (!move) return
        event.preventDefault()
        focusDay.current = true
        setCursor(move(cursor, event))
    }

    const navButton = (label, Icon, months) => (
        <button type='button' className='date-field-nav' aria-label={label} onClick={() => setCursor(sumarMeses(cursor, months))}>
            <Icon size={16} aria-hidden='true' />
        </button>
    )

    return (
        <>
            <div className='date-field-header'>
                {navButton('Año anterior', ChevronsLeft, -12)}
                {navButton('Mes anterior', ChevronLeft, -1)}
                <span className='date-field-month' aria-live='polite'>{tituloDelMes(cursor)}</span>
                {navButton('Mes siguiente', ChevronRight, 1)}
                {navButton('Año siguiente', ChevronsRight, 12)}
            </div>

            <table ref={gridRef} className='date-field-grid' role='grid' aria-label={tituloDelMes(cursor)} onKeyDown={handleKeyDown}>
                <thead>
                    <tr>
                        {weekdays.map(([short, full]) => <th key={short} scope='col' abbr={full}>{short}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {semanasDelMes(cursor).map((week) => (
                        <tr key={week[0].fecha}>
                            {week.map(({ fecha, delMes }) => (
                                <td key={fecha}>
                                    <button
                                        type='button'
                                        className='date-field-day'
                                        tabIndex={fecha === cursor ? 0 : -1}
                                        aria-label={fechaLarga(fecha)}
                                        aria-pressed={fecha === value}
                                        aria-current={fecha === today ? 'date' : undefined}
                                        data-outside={delMes ? undefined : ''}
                                        onClick={() => onSelect(fecha)}
                                    >
                                        {Number(fecha.slice(8))}
                                    </button>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className='date-field-footer'>
                <button type='button' className='date-field-action' onClick={() => onSelect(today)}>Hoy</button>
                <button type='button' className='date-field-action' disabled={!value} onClick={() => onSelect('')}>Limpiar</button>
            </div>
        </>
    )
}

// Campo de fecha del panel con la identidad de DC Hobbies; reemplaza a <input type='date'>, cuyo calendario
// lo dibuja el navegador y no se puede pintar. `value` y `onChange` usan texto 'AAAA-MM-DD' ('' sin fecha).
// `label` nombra el campo para el lector de pantalla. Radix pone el portal, el cierre con Escape o clic afuera
// y devolver el foco al campo al cerrar.
function DateField({ value, onChange, label, className = '' }) {
    const [open, setOpen] = useState(false)

    const select = (date) => {
        onChange(date)
        setOpen(false)
    }

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger
                type='button'
                className={`control date-field-trigger ${className}`.trim()}
                aria-label={`${label}: ${value ? fechaLarga(value) : 'sin fecha'}`}
            >
                <span className={value ? undefined : 'date-field-placeholder'}>{value ? fechaCorta(value) : 'Elegir fecha'}</span>
                <CalendarDays size={16} className='date-field-icon' aria-hidden='true' />
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    className='date-field-content'
                    align='start'
                    sideOffset={4}
                    collisionPadding={8}
                    aria-label={`Calendario: ${label}`}
                    // El foco lo pone el calendario en el día elegido, no en el primer botón
                    onOpenAutoFocus={(event) => event.preventDefault()}
                >
                    <Calendar value={value} onSelect={select} />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}

export default DateField
