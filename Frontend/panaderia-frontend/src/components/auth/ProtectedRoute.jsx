// src/components/auth/ProtectedRoute.jsx - MEJORADO PARA OAUTH
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { accessToken, loading } = useAuth();
  const location = useLocation();

  // Mientras se verifica autenticación, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-[#5D4037]">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // ⭐ CRÍTICO: Si estamos en /dashboard con hash OAuth, NO redirigir
  // Dejar que Dashboard.jsx procese los tokens primero
  if (location.pathname === '/dashboard' && window.location.hash.includes('access=')) {
    console.log("🔐 ProtectedRoute: Detectado OAuth, permitiendo acceso a Dashboard para procesar tokens");
    return children;
  }

  // Si después de loading NO hay token, redirigir a login
  if (!accessToken) {
    console.log("🚫 ProtectedRoute: No autenticado, redirigiendo a /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay token, mostrar contenido protegido
  console.log("✅ ProtectedRoute: Usuario autenticado, permitiendo acceso");
  return children;
}