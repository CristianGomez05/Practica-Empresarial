// Frontend/panaderia-frontend/src/App.jsx
// ⭐ ACTUALIZADO: Agregadas rutas de recuperación de contraseña y perfiles de admin

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Páginas públicas
import Landing from "./pages/Landing";
import Catalog from "./pages/Catalog";
import LoginPage from "./pages/LoginPage";
import RegisterPage from './pages/RegisterPage';
import ProductDetail from "./components/products/ProductDetail";
import OrderConfirmation from "./pages/OrderConfirmation";

// ⭐⭐⭐ NUEVAS: Password Reset Pages
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Dashboard OAuth
import Dashboard from "./pages/Dashboard";

// Dashboard de Cliente
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardProducts from "./pages/dashboard/DashboardProducts";
import DashboardOffers from "./pages/dashboard/DashboardOffers";
import DashboardCart from "./pages/dashboard/DashboardCart";
import DashboardOrders from "./pages/dashboard/DashboardOrders";
import DashboardProfile from "./pages/dashboard/DashboardProfile";

// Admin Regular
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOffers from "./pages/admin/AdminOffers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReports from "./pages/admin/AdminReports";
import AdminProfile from "./pages/admin/AdminProfile"; // ⭐⭐⭐ NUEVO

// Admin General
import AdminGeneralLayout from "./components/admin/AdminGeneralLayout";
import AdminGeneralDashboard from "./pages/admin_general/AdminGeneralDashboard";
import AdminGeneralBranches from "./pages/admin_general/AdminGeneralBranches";
import AdminGeneralProducts from "./pages/admin_general/AdminGeneralProducts";
import AdminGeneralOffers from "./pages/admin_general/AdminGeneralOffers";
import AdminGeneralOrders from "./pages/admin_general/AdminGeneralOrders";
import AdminGeneralUsers from "./pages/admin_general/AdminGeneralUsers";
import AdminGeneralReports from "./pages/admin_general/AdminGeneralReports";
import AdminGeneralProfile from "./pages/admin_general/AdminGeneralProfile"; // ⭐⭐⭐ NUEVO

// Rutas protegidas
import AdminRoute from "./components/auth/AdminRoute";
import AdminGeneralRoute from "./components/auth/AdminGeneralRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import "./App.css";

function App() {
  useEffect(() => {
    console.log("🚀 App cargada - Sistema de Panadería");
    console.log("🔗 API URL:", import.meta.env.VITE_API_URL);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================
            RUTAS PÚBLICAS
        ======================================== */}
        <Route path="/" element={<Landing />} />
        <Route path="/productos" element={<Catalog />} />
        <Route path="/productos/:id" element={<ProductDetail />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ⭐⭐⭐ NUEVAS: Password Reset Routes */}
        <Route path="/olvide-password" element={<ForgotPasswordPage />} />
        <Route path="/recuperar-password/:uid/:token" element={<ResetPasswordPage />} />

        {/* ========================================
            DASHBOARD OAUTH (Sin Layout)
        ======================================== */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* ========================================
            DASHBOARD DE CLIENTE (Con Layout)
        ======================================== */}
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

        {/* ========================================
            PANEL DE ADMINISTRADOR REGULAR
        ======================================== */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="productos" element={<AdminProducts />} />
          <Route path="ofertas" element={<AdminOffers />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="reportes" element={<AdminReports />} />
          <Route path="perfil" element={<AdminProfile />} /> {/* ⭐⭐⭐ NUEVO */}
        </Route>

        {/* ========================================
            PANEL DE ADMINISTRADOR GENERAL
        ======================================== */}
        <Route path="/admin-general" element={
          <AdminGeneralRoute>
            <AdminGeneralLayout />
          </AdminGeneralRoute>
        }>
          <Route index element={<AdminGeneralDashboard />} />
          <Route path="sucursales" element={<AdminGeneralBranches />} />
          <Route path="productos" element={<AdminGeneralProducts />} />
          <Route path="ofertas" element={<AdminGeneralOffers />} />
          <Route path="pedidos" element={<AdminGeneralOrders />} />
          <Route path="usuarios" element={<AdminGeneralUsers />} />
          <Route path="reportes" element={<AdminGeneralReports />} />
          <Route path="perfil" element={<AdminGeneralProfile />} /> {/* ⭐⭐⭐ NUEVO */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;