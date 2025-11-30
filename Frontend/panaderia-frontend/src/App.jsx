// src/App.jsx - ACTUALIZADO Y LIMPIO
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
import RegisterPage from './pages/RegisterPage';

// Importar componentes de ADMINISTRADOR REGULAR
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOffersPanel from "./pages/admin/AdminOffersPanel";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReports from "./pages/admin/AdminReports";

// ⭐ Importar componentes de ADMIN GENERAL
import AdminGeneralLayout from "./components/admin/AdminGeneralLayout";
import AdminGeneralDashboard from "./pages/admin/AdminGeneralDashboard";
import AdminBranches from "./pages/admin/AdminBranches";
import AdminUsers from "./pages/admin/AdminUsers";

// Rutas protegidas
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import AdminGeneralRoute from "./components/auth/AdminGeneralRoute";
import "./App.css";

function App() {
  useEffect(() => {
    console.log("🔗 API URL:", import.meta.env.VITE_API_URL);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ==================== RUTAS PÚBLICAS ==================== */}
        <Route path="/" element={<Landing />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/producto/:id" element={<ProductDetail />} />
        
        {/* Dashboard principal (punto de entrada OAuth) */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* ==================== DASHBOARD CLIENTE (Protegido) ==================== */}
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
          <Route path="pedido-confirmado/:id" element={<OrderConfirmation />} />
        </Route>

        {/* ==================== PANEL ADMINISTRADOR REGULAR ==================== */}
        {/* 🔒 Solo para administradores de sucursal */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="productos" element={<AdminProducts />} />
          <Route path="ofertas" element={<AdminOffersPanel />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="reportes" element={<AdminReports />} />
        </Route>

        {/* ==================== PANEL ADMINISTRADOR GENERAL ==================== */}
        {/* 👑 Solo para administrador general (acceso total) */}
        <Route path="/admin-general" element={
          <AdminGeneralRoute>
            <AdminGeneralLayout />
          </AdminGeneralRoute>
        }>
          <Route index element={<AdminGeneralDashboard />} />
          <Route path="sucursales" element={<AdminBranches />} />
          <Route path="productos" element={<AdminProducts />} />
          <Route path="ofertas" element={<AdminOffersPanel />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="usuarios" element={<AdminUsers />} />
          <Route path="reportes" element={<AdminReports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;