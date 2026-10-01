import { Outlet } from 'react-router'
import Header from '../header/Header.jsx'
import Footer from '../footer/Footer.jsx'
import { useCategorias } from '../../hooks/useCategorias.js'

// Estructura de la tienda. Pide las categorías una sola vez y las reparte:
// el encabezado y el pie las reciben por props, y la página de adentro
// (por ejemplo Inicio) las lee con useOutletContext.
function StoreLayout() {
    const categorias = useCategorias()
    const categoryNames = categorias.datos?.map(({ nombre }) => nombre) ?? []

    return (
        <>
            <Header categories={categoryNames} />
            <Outlet context={{ categorias }} />
            <Footer categories={categoryNames} />
        </>
    )
}

export default StoreLayout
