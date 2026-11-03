import { BrowserRouter, Routes, Route } from 'react-router'
import SessionProvider from './context/SessionProvider.jsx'
import StoreLayout from './components/store-layout/StoreLayout.jsx'
import AdminRoute from './components/admin-route/AdminRoute.jsx'
import SessionRoute from './components/session-route/SessionRoute.jsx'
import AccessLayout from './components/access-layout/AccessLayout.jsx'
import Home from './pages/home/Home.jsx'
import Catalog from './pages/catalog/Catalog.jsx'
import ProductDetail from './pages/product-detail/ProductDetail.jsx'
import MyAccount from './pages/my-account/MyAccount.jsx'
import Products from './pages/products/Products.jsx'
import Families from './pages/families/Families.jsx'
import Access from './pages/access/Access.jsx'
import ForgotPassword from './pages/access/ForgotPassword.jsx'
import ResetPassword from './pages/access/ResetPassword.jsx'

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route index element={<Home />} />
            <Route path='catalogo' element={<Catalog />} />
            <Route path='catalogo/:category' element={<Catalog />} />
            <Route path='producto/:sku' element={<ProductDetail />} />
            <Route element={<SessionRoute />}>
              <Route path='mi-cuenta' element={<MyAccount />} />
            </Route>
          </Route>
          <Route element={<AccessLayout />}>
            <Route path='/acceso' element={<Access />} />
            <Route path='/recuperar-contrasena' element={<ForgotPassword />} />
            <Route path='/restablecer' element={<ResetPassword />} />
          </Route>
          <Route path='/admin' element={<AdminRoute />}>
            <Route path='productos' element={<Products />} />
            <Route path='familias' element={<Families />} />
          </Route>
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  )
}

export default App
