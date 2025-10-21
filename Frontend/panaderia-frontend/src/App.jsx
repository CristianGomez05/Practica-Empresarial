import Landing from './pages/Landing';
import Catalog from './pages/Catalog';
import LoginPage from './pages/LoginPage';
import ProductList from './components/products/ProductList';
import ProductDetail from './components/products/ProductDetail';
import './App.css'
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  useEffect(() => {
    console.log("🔗 API URL:", import.meta.env.VITE_API_URL);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing/>} />
        <Route path="/catalogo" element={<Catalog/>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/producto/:id" element={<ProductDetail/>} />
        <Route path="/catalogo" element={<ProductList/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
