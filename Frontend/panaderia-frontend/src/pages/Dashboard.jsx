// src/pages/Dashboard.jsx - CORREGIDO COMPLETAMENTE
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
          // Guardar token
          localStorage.setItem("access", access);
          setAccessToken(access);
          
          // ⭐⭐⭐ CRÍTICO: Decodificar, crear objeto de usuario y GUARDAR EN LOCALSTORAGE
          try {
            const decoded = jwtDecode(access);
            console.log("🔍 Token decodificado completo:", decoded);
            console.log("🔍 Rol del usuario:", decoded.rol);
            
            // Crear objeto de usuario con TODA la información del token
            const userInfo = {
              id: decoded.user_id || decoded.id,
              username: decoded.username,
              email: decoded.email,
              first_name: decoded.first_name || '',
              last_name: decoded.last_name || '',
              rol: decoded.rol,
              sucursal_id: decoded.sucursal_id || null,
              sucursal_nombre: decoded.sucursal_nombre || null,
              avatar: decoded.avatar || null
            };
            
            console.log("✅ userInfo completo:", userInfo);
            
            // ⭐⭐⭐ GUARDAR EN LOCALSTORAGE (esto faltaba!)
            localStorage.setItem('user', JSON.stringify(userInfo));
            console.log("💾 Usuario guardado en localStorage");
            
            // Actualizar contexto
            setUser(userInfo);
            console.log("✅ Usuario autenticado en contexto");
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

  // ⭐ Redirigir según rol específico DESPUÉS de procesar tokens
  useEffect(() => {
    // Solo redirigir cuando YA no esté procesando
    if (processing) return;

    // Si no hay token y no hay hash con tokens, redirigir a login
    if (!accessToken && !window.location.hash.includes("access=")) {
      console.log("⚠️ No autenticado después de procesar, redirigiendo a login");
      navigate("/login", { replace: true });
      return;
    }

    // Si hay token y usuario, redirigir según rol
    if (accessToken && user) {
      console.log("✅ Autenticado, verificando rol:", user.rol);
      
      if (user.rol === 'administrador_general') {
        console.log("👑👑 Admin General detectado → /admin-general");
        navigate("/admin-general", { replace: true });
      } else if (user.rol === 'administrador') {
        console.log("👑 Admin Regular detectado → /admin");
        navigate("/admin", { replace: true });
      } else {
        console.log("👤 Cliente detectado → /dashboard/inicio");
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