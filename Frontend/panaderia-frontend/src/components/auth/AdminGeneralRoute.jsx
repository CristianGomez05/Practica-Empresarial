// src/components/auth/AdminGeneralRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function AdminGeneralRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
          <p className="text-[#5D4037]">Verificando permisos de administrador general...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!user) {
    console.log("🚫 AdminGeneralRoute: No autenticado, redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  // ⭐ SOLO Admin General puede acceder
  if (user.rol !== 'administrador_general') {
    console.log(`🚫 AdminGeneralRoute: Rol "${user.rol}" no autorizado`);
    
    // Redirigir según el rol
    if (user.rol === 'administrador') {
      console.log("🔀 Redirigiendo Admin Regular a /admin");
      return <Navigate to="/admin" replace />;
    } else {
      console.log("🔀 Redirigiendo Cliente a /dashboard/inicio");
      return <Navigate to="/dashboard/inicio" replace />;
    }
  }

  // Si es admin general, mostrar contenido
  console.log("✅ AdminGeneralRoute: Acceso permitido - Admin General");
  return children;
}