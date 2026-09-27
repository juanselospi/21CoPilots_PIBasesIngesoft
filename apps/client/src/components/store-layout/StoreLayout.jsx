import { Outlet } from 'react-router'
import Header from '../header/Header.jsx'
import Footer from '../footer/Footer.jsx'

function StoreLayout() {
    return (
        <>
            <Header />
            <Outlet />
            <Footer />
        </>
    )
}

export default StoreLayout
