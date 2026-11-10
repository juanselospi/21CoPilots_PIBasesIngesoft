import { Check, Circle } from 'lucide-react'
import './PasswordRules.css'
import { requisitosContrasena } from '../../utils/politicaContrasena.js'

// Lista con la politica de contraseñas, cada requisito se marca cuando `value` ya lo cumple.
// El `id` es para conectar la lista con el input por aria-describedby.
// `compact` los muestra como pastillas en fila que bajan de línea si no caben (crear cuenta)
function PasswordRules({ value, id, compact = false }) {
    return (
        <ul id={id} className={compact ? 'password-rules password-rules-compact' : 'password-rules'}>
            {requisitosContrasena.map(({ texto, patron }) => {
                const met = patron.test(value)
                const Icon = met ? Check : Circle
                return (
                    <li key={texto} className={met ? 'password-rule password-rule-met' : 'password-rule'}>
                        <Icon size={14} role='img' aria-label={met ? 'Cumplido:' : 'Pendiente:'} />
                        {texto}
                    </li>
                )
            })}
        </ul>
    )
}

export default PasswordRules
