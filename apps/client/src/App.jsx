import { BrowserRouter, Routes, Route } from 'react-router'
import SessionProvider from './context/SessionProvider.jsx'
import StoreLayout from './components/store-layout/StoreLayout.jsx'
import AdminRoute from './components/admin-route/AdminRoute.jsx'
import Home from './pages/home/Home.jsx'
import Catalog from './pages/catalog/Catalog.jsx'
import Products from './pages/products/Products.jsx'
import Access from './pages/access/Access.jsx'

function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route index element={<Home />} />
            <Route path='catalogo' element={<Catalog />} />
            <Route path='catalogo/:category' element={<Catalog />} />
          </Route>
          <Route path='/acceso' element={<Access />} />
          <Route path='/admin' element={<AdminRoute />}>
            <Route path='productos' element={<Products />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}

export default App
