// src/components/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { accessToken, loading } = useAuth();

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

  // Si después de loading NO hay token, redirigir a login
  if (!accessToken) {
    console.log("🚫 No autenticado, redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  // Si hay token, mostrar contenido protegido
  return children;
}