import { Outlet } from 'react-router'
import Header from '../header/Header.jsx'
import Footer from '../footer/Footer.jsx'
import { useCategorias } from '../../hooks/useCategorias.js'
import { useSesion } from '../../hooks/useSesion.js'

// Estructura de la tienda. Pide las categorías una sola vez y las reparte:
// el encabezado y el pie las reciben por props, y la página de adentro
// Por ejemplo para el Inicio las lee con useOutletContext, junto con el estado de la petición para avisar si todavía cargan o si falló.
function StoreLayout() {
    const categorias = useCategorias()
    const categoryNames = categorias.datos?.map(({ nombre }) => nombre) ?? []
    const { usuario, cargando } = useSesion()

    return (
        <>
            <Header categories={categoryNames} user={usuario} loadingSession={cargando} />
            <Outlet context={{ categorias, categoryNames }} />
            <Footer categories={categoryNames} />
        </>
    )
}

export default StoreLayout
