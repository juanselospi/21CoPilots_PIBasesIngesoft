import { createContext } from 'react'

// Sesion del usuario que comparten el header y las rutas del panel
// Luego de crearse es llenada por SessionProvider
export const SessionContext = createContext(null)
