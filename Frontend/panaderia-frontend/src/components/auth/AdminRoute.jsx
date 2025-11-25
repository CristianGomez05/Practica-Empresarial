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

  // ⭐ Roles administrativos permitidos
  const rolesAdmin = ['administrador', 'administrador_general'];

  // Si no es administrador (regular o general), redirigir al dashboard
  if (!rolesAdmin.includes(user.rol)) {
    console.log(`🚫 Rol "${user.rol}" no autorizado, redirigiendo a /dashboard/inicio`);
    return <Navigate to="/dashboard/inicio" replace />;
  }

  // Si es administrador o administrador_general, mostrar contenido
  console.log(`✅ Acceso permitido - Rol: ${user.rol}`);
  return children;
}