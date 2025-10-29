// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../components/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Dashboard() {
  const { user, setUser, setAccessToken, setRefreshToken, accessToken } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processTokens = () => {
      const hash = window.location.hash;
      
      console.log("📍 Dashboard montado, hash:", hash);
      console.log("📍 Token actual en localStorage:", localStorage.getItem("access"));
      
      // Si hay tokens en el hash, procesarlos PRIMERO
      if (hash && (hash.includes("access=") || hash.includes("refresh="))) {
        console.log("🔑 Procesando tokens de Google OAuth...");
        
        const fragment = hash.substring(1);
        const params = new URLSearchParams(fragment);
        const access = params.get("access");
        const refresh = params.get("refresh");

        console.log("🔑 Access token extraído:", access ? "✅ Presente" : "❌ Ausente");
        console.log("🔑 Refresh token extraído:", refresh ? "✅ Presente" : "❌ Ausente");

        if (access) {
          localStorage.setItem("access", access);
          setAccessToken(access);
          
          // Decodificar y setear usuario inmediatamente
          try {
            const decoded = jwtDecode(access);
            console.log("🔍 Token decodificado completo:", decoded);
            console.log("🔍 Rol del usuario:", decoded.rol);
            console.log("🔍 Todas las propiedades:", Object.keys(decoded));
            setUser(decoded);
            console.log("✅ Usuario autenticado:", decoded);
          } catch (error) {
            console.error("❌ Error al decodificar token:", error);
          }
        }
        
        if (refresh) {
          localStorage.setItem("refresh", refresh);
          setRefreshToken(refresh);
        }

        // Limpiar URL sin recargar página
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log("✅ URL limpiada");
      } else {
        console.log("ℹ️ No hay tokens en el hash");
        
        // Si no hay tokens en el hash, verificar si ya hay token en localStorage
        const storedToken = localStorage.getItem("access");
        if (!storedToken) {
          console.log("🚫 No hay sesión activa, redirigiendo a login");
          navigate("/login", { replace: true });
          return;
        }
      }
      
      setProcessing(false);
    };

    processTokens();
  }, [setUser, setAccessToken, setRefreshToken, navigate]);

  // Verificar autenticación y redirigir según rol
  useEffect(() => {
    if (!processing && !accessToken && !window.location.hash.includes("access=")) {
      console.log("⚠️ No autenticado después de procesar, redirigiendo...");
      navigate("/login", { replace: true });
    } else if (!processing && accessToken && user) {
      // ✨ NUEVA LÓGICA: Redirigir según rol
      console.log("✅ Autenticado, verificando rol:", user.rol);
      
      if (user.rol === 'administrador') {
        console.log("👑 Usuario administrador detectado, redirigiendo a panel admin");
        navigate("/admin", { replace: true });
      } else {
        console.log("👤 Usuario cliente, redirigiendo a dashboard cliente");
        navigate("/dashboard/inicio", { replace: true });
      }
    }
  }, [processing, accessToken, user, navigate]);

  // Mostrar loading mientras se procesan tokens
  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-[#5D4037]">Procesando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario después de procesar, mostrar loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-[#5D4037]">Cargando información del usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-[#5D4037] mb-2">
            Redirigiendo... 🥐
          </h1>
          <p className="text-[#6D4C41]">
            Por favor espera un momento...
          </p>
        </div>
      </div>
    </div>
  );
}