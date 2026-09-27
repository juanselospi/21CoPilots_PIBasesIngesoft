import { BrowserRouter, Routes, Route } from 'react-router'
import StoreLayout from './components/store-layout/StoreLayout.jsx'
import Home from './pages/home/Home.jsx'
import Products from './pages/products/Products.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<Home />} />
        </Route>
        <Route path='/admin/productos' element={<Products />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
