import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown } from 'lucide-react'
import './UserMenu.css'
import ConfirmDialog from '../confirm-dialog/ConfirmDialog.jsx'
import { MY_ORDERS_PATH } from '../../routes.js'

const CLIENT_ROLE = 'cliente'

// Iniciales para el circulo del usuario: "Juan Loaiza" -> "JL".
const toInitials = (nombre) =>
    nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0].toUpperCase()).join('')

// Menu de la cuenta que sale en el header de la tienda y en la barra del panel.
// `onLogOut` cierra la sesion y `logOutMessage` es el texto del dialogo, cambia si se sale de la tienda o del panel
function UserMenu({ user, onLogOut, logOutMessage }) {
    const [open, setOpen] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const menuRef = useRef(null)
    const panelId = useId()

    // Si el menu esta abierto se cierra con un clic afuera o con Escape
    useEffect(() => {
        if (!open) return
        const closeOutside = (event) => {
            if (!menuRef.current?.contains(event.target)) setOpen(false)
        }
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('pointerdown', closeOutside)
        document.addEventListener('keydown', closeOnEscape)
        return () => {
            document.removeEventListener('pointerdown', closeOutside)
            document.removeEventListener('keydown', closeOnEscape)
        }
    }, [open])

    const askLogOut = () => {
        setOpen(false)
        setConfirming(true)
    }

    return (
        <div className='user-menu' ref={menuRef}>
            <button
                type='button'
                className='user-menu-button'
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                onClick={() => setOpen((visible) => !visible)}
            >
                <span className='user-menu-initials' aria-hidden='true'>{toInitials(user.nombre)}</span>
                Hola, {user.nombre.split(/\s+/)[0]}
                <ChevronDown size={16} aria-hidden='true' />
            </button>

            {open && (
                <div id={panelId} className='user-menu-panel'>
                    <div className='user-menu-identity'>
                        <strong>{user.nombre}</strong>
                        <span>{user.correo}</span>
                    </div>
                    <Link to='/mi-cuenta' className='user-menu-item' onClick={() => setOpen(false)}>Mi cuenta</Link>
                    {/* El administrador no tiene pedidos propios */}
                    {user.rol === CLIENT_ROLE && (
                        <Link to={MY_ORDERS_PATH} className='user-menu-item' onClick={() => setOpen(false)}>Mis pedidos</Link>
                    )}
                    <button type='button' className='user-menu-item user-menu-logout' onClick={askLogOut}>
                        Cerrar sesión
                    </button>
                </div>
            )}

            {confirming && (
                <ConfirmDialog
                    title='¿Cerrar sesión?'
                    message={logOutMessage}
                    confirmLabel='Cerrar sesión'
                    busyLabel='Cerrando sesión…'
                    onConfirm={onLogOut}
                    onCancel={() => setConfirming(false)}
                />
            )}
        </div>
    )
}

export default UserMenu
