// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Catalog from "./pages/Catalog";
import LoginPage from "./pages/LoginPage";
import ProductDetail from "./components/products/ProductDetail";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardProducts from "./pages/dashboard/DashboardProducts";
import DashboardOffers from "./pages/dashboard/DashboardOffers";
import DashboardCart from "./pages/dashboard/DashboardCart";
import DashboardOrders from "./pages/dashboard/DashboardOrders";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import OrderConfirmation from "./pages/OrderConfirmation";
import AdminOffersPanel from "./pages/admin/AdminOffersPanel";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import "./App.css";

function App() {
  useEffect(() => {
    console.log("🔗 API URL:", import.meta.env.VITE_API_URL);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/producto/:id" element={<ProductDetail />} />
        
        {/* Dashboard principal (punto de entrada OAuth) */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Dashboard con layout y subrutas protegidas */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="inicio" element={<DashboardHome />} />
          <Route path="productos" element={<DashboardProducts />} />
          <Route path="ofertas" element={<DashboardOffers />} />
          <Route path="carrito" element={<DashboardCart />} />
          <Route path="pedidos" element={<DashboardOrders />} />
          <Route path="perfil" element={<DashboardProfile />} />
          
          {/* Nueva ruta de confirmación de pedido */}
          <Route path="pedido-confirmado/:id" element={<OrderConfirmation />} />
          
          {/* Rutas de administrador */}
          <Route path="admin/ofertas" element={
            <AdminRoute>
              <AdminOffersPanel />
            </AdminRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;