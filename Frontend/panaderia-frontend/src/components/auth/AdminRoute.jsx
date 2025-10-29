// src/components/auth/AdminRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
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

  // Si no es administrador, redirigir al dashboard
  if (user.rol !== 'administrador') {
    console.log("🚫 No es administrador, redirigiendo a /dashboard/inicio");
    return <Navigate to="/dashboard/inicio" replace />;
  }

  // Si es administrador, mostrar contenido
  return children;
}