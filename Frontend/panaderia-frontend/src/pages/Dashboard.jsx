// src/pages/Dashboard.jsx - CON LOGS DE DEBUGGING
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
      
      console.log("=====================================");
      console.log("📍 Dashboard.jsx - processTokens()");
      console.log("=====================================");
      console.log("🔗 URL completa:", window.location.href);
      console.log("📍 Hash:", hash);
      console.log("📍 Token en localStorage:", localStorage.getItem("access") ? "✅ Existe" : "❌ No existe");
      console.log("📍 Usuario en localStorage:", localStorage.getItem("user") ? "✅ Existe" : "❌ No existe");
      console.log("=====================================");
      
      // Si hay tokens en el hash, procesarlos PRIMERO
      if (hash && (hash.includes("access=") || hash.includes("refresh="))) {
        console.log("🔑 PROCESANDO TOKENS DE OAUTH...");
        
        const fragment = hash.substring(1);
        const params = new URLSearchParams(fragment);
        const access = params.get("access");
        const refresh = params.get("refresh");

        console.log("🔑 Access token:", access ? `✅ Presente (${access.substring(0, 20)}...)` : "❌ Ausente");
        console.log("🔑 Refresh token:", refresh ? `✅ Presente (${refresh.substring(0, 20)}...)` : "❌ Ausente");

        if (access) {
          // Guardar token
          console.log("💾 Guardando access token en localStorage...");
          localStorage.setItem("access", access);
          setAccessToken(access);
          console.log("✅ Access token guardado");
          
          // ⭐⭐⭐ CRÍTICO: Decodificar, crear objeto de usuario y GUARDAR EN LOCALSTORAGE
          try {
            const decoded = jwtDecode(access);
            console.log("🔍 Token decodificado:", decoded);
            
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
            
            console.log("✅ userInfo creado:", userInfo);
            console.log("👤 Rol del usuario:", userInfo.rol);
            
            // ⭐⭐⭐ GUARDAR EN LOCALSTORAGE
            console.log("💾 Guardando usuario en localStorage...");
            localStorage.setItem('user', JSON.stringify(userInfo));
            console.log("✅ Usuario guardado en localStorage");
            
            // Actualizar contexto
            console.log("🔄 Actualizando contexto con setUser()...");
            setUser(userInfo);
            console.log("✅ Usuario establecido en contexto");
          } catch (error) {
            console.error("❌ ERROR al decodificar token:", error);
          }
        }
        
        if (refresh) {
          console.log("💾 Guardando refresh token en localStorage...");
          localStorage.setItem("refresh", refresh);
          setRefreshToken(refresh);
          console.log("✅ Refresh token guardado");
        }

        // Limpiar URL sin recargar página
        console.log("🧹 Limpiando hash de la URL...");
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log("✅ URL limpiada:", cleanUrl);
      } else {
        console.log("ℹ️ No hay tokens OAuth en el hash");
        
        // Si no hay tokens en el hash, verificar si ya hay token en localStorage
        const storedToken = localStorage.getItem("access");
        const storedUser = localStorage.getItem("user");
        
        console.log("🔍 Verificando localStorage:");
        console.log("  - Token:", storedToken ? "✅ Presente" : "❌ Ausente");
        console.log("  - Usuario:", storedUser ? "✅ Presente" : "❌ Ausente");
        
        if (!storedToken) {
          console.log("🚫 No hay sesión activa, redirigiendo a /login");
          navigate("/login", { replace: true });
          return;
        } else {
          console.log("✅ Hay sesión guardada, continuando...");
        }
      }
      
      console.log("✅ Finalizando procesamiento de tokens");
      console.log("=====================================");
      setProcessing(false);
    };

    processTokens();
  }, [setUser, setAccessToken, setRefreshToken, navigate]);

  // ⭐ Redirigir según rol específico DESPUÉS de procesar tokens
  useEffect(() => {
    console.log("🔄 useEffect de redirección ejecutado");
    console.log("  - processing:", processing);
    console.log("  - accessToken:", accessToken ? "✅ Presente" : "❌ Ausente");
    console.log("  - user:", user ? `✅ Presente (${user.rol})` : "❌ Ausente");
    
    // Solo redirigir cuando YA no esté procesando
    if (processing) {
      console.log("⏳ Aún procesando, no redirigir todavía");
      return;
    }

    // Si no hay token y no hay hash con tokens, redirigir a login
    if (!accessToken && !window.location.hash.includes("access=")) {
      console.log("⚠️ No autenticado después de procesar → /login");
      navigate("/login", { replace: true });
      return;
    }

    // Si hay token y usuario, redirigir según rol
    if (accessToken && user) {
      console.log("✅ Usuario autenticado, redirigiendo según rol...");
      console.log("👤 Rol detectado:", user.rol);
      
      if (user.rol === 'administrador_general') {
        console.log("👑👑 Admin General → /admin-general");
        navigate("/admin-general", { replace: true });
      } else if (user.rol === 'administrador') {
        console.log("👑 Admin Regular → /admin");
        navigate("/admin", { replace: true });
      } else {
        console.log("👤 Cliente → /dashboard/inicio");
        navigate("/dashboard/inicio", { replace: true });
      }
    } else {
      console.log("⏳ Esperando a que se establezca el usuario...");
    }
  }, [processing, accessToken, user, navigate]);

  // Mostrar loading mientras se procesan tokens
  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-[#5D4037]">Procesando autenticación OAuth...</p>
          <p className="text-xs text-gray-500 mt-2">Revisando tokens...</p>
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
          <p className="text-xs text-gray-500 mt-2">Estableciendo sesión...</p>
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
          <p className="text-xs text-gray-500 mt-2">
            Rol: {user?.rol || 'Detectando...'}
          </p>
        </div>
      </div>
    </div>
  );
}