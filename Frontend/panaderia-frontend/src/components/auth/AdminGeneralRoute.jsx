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
          <p className="text-[#5D4037]">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!user) {
    console.log("🚫 No autenticado, redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  // Solo Admin General puede acceder
  if (user.rol !== 'administrador_general') {
    console.log(`🚫 Rol "${user.rol}" no autorizado para Admin General, redirigiendo`);
    
    // Redirigir según su rol
    if (user.rol === 'administrador') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard/inicio" replace />;
    }
  }

  // Si es Admin General, mostrar contenido
  console.log(`✅ Acceso permitido - Admin General`);
  return children;
}