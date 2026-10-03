import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos/tokens.css'
import './estilos/base.css'
import './estilos/componentes.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
