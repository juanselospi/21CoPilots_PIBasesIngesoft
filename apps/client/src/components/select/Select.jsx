import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import './Select.css'

// Radix no admite opciones con valor vacío; «Todas» y similares viajan con este valor
const EMPTY = '__vacio__'
const toRadix = (value) => (value === '' || value === null || value === undefined ? EMPTY : String(value))
const fromRadix = (value) => (value === EMPTY ? '' : value)

// Selector del panel con la identidad de DC Hobbies; reemplaza al <select> nativo, cuyo menú
// no se puede pintar. Radix pone la navegación con teclado, la búsqueda por letras, el cierre
// con Escape o clic afuera y los roles para el lector de pantalla. El menú se abre en un portal,
// así que no lo recorta el `overflow: hidden` del panel de filtros ni de los modales.
//
// `options`: [{ value, label }]. `onChange` recibe el valor como texto ('' para la opción vacía).
// Las demás props (id, name, className, aria-*) van al botón, que hace de campo: así una
// <label> que lo envuelve lo nombra y useFormulario lo encuentra por `name` para enfocarlo.
function Select({ value, onChange, options, disabled, className = '', ...triggerProps }) {
    return (
        <RadixSelect.Root value={toRadix(value)} onValueChange={(next) => onChange(fromRadix(next))} disabled={disabled}>
            <RadixSelect.Trigger className={`control select-trigger ${className}`.trim()} {...triggerProps}>
                <RadixSelect.Value />
                <RadixSelect.Icon className='select-chevron'>
                    <ChevronDown size={16} aria-hidden='true' />
                </RadixSelect.Icon>
            </RadixSelect.Trigger>

            <RadixSelect.Portal>
                <RadixSelect.Content
                    className='select-content'
                    position='popper'
                    sideOffset={4}
                    collisionPadding={8}
                    // Escape cierra solo el menú, no el modal que lo contiene
                    onEscapeKeyDown={(event) => event.stopPropagation()}
                >
                    <RadixSelect.Viewport className='select-viewport'>
                        {options.map((option) => (
                            <RadixSelect.Item key={toRadix(option.value)} value={toRadix(option.value)} className='select-item'>
                                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                                <RadixSelect.ItemIndicator className='select-check'>
                                    <Check size={16} aria-hidden='true' />
                                </RadixSelect.ItemIndicator>
                            </RadixSelect.Item>
                        ))}
                    </RadixSelect.Viewport>
                </RadixSelect.Content>
            </RadixSelect.Portal>
        </RadixSelect.Root>
    )
}

export default Select
