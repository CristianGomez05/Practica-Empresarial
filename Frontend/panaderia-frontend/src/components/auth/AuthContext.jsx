// src/components/auth/AuthContext.jsx - CORREGIDO
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("access"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refresh"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // ⭐ Cargar usuario desde localStorage si existe
  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("📦 Usuario cargado desde localStorage:", parsedUser);
        setUser(parsedUser);
        return parsedUser;
      } catch (error) {
        console.error("❌ Error parseando usuario de localStorage:", error);
        localStorage.removeItem("user");
        return null;
      }
    }
    return null;
  };

  // Decodificar token y setear usuario
  const decodeUser = (token) => {
    try {
      const decoded = jwtDecode(token);
      console.log("🔍 Token decodificado:", decoded);
      
      // Intentar cargar datos completos desde localStorage primero
      const storedUser = loadUserFromStorage();
      
      // Si hay datos en localStorage, usarlos (tienen más información)
      if (storedUser && storedUser.id === decoded.user_id) {
        console.log("✅ Usando datos completos desde localStorage");
        setUser(storedUser);
        return storedUser;
      }
      
      // Si no, usar datos del token
      const userFromToken = {
        ...decoded,
        id: decoded.user_id || decoded.id,
        avatar: decoded.avatar || null
      };
      console.log("✅ Usuario desde token:", userFromToken);
      setUser(userFromToken);
      return userFromToken;
    } catch (error) {
      console.error("❌ Error al decodificar token:", error);
      setUser(null);
      return null;
    }
  };

  // Verificar expiración del token
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // Refrescar token automáticamente
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      console.log("⚠️ No hay refresh token, haciendo logout");
      return logout();
    }

    try {
      console.log("🔄 Intentando refrescar token...");
      const response = await axios.post(`${API_BASE}/api/token/refresh/`, {
        refresh: refreshToken,
      });
      const newAccess = response.data.access;
      localStorage.setItem("access", newAccess);
      setAccessToken(newAccess);
      decodeUser(newAccess);
      console.log("✅ Token refrescado exitosamente");
      return newAccess;
    } catch (error) {
      console.error("⚠️ Error al refrescar token:", error);
      logout();
    }
  };

  // Logout limpio - SIN redirección automática
  const logout = () => {
    console.log("🚪 Cerrando sesión...");
    
    // Limpiar el carrito del usuario actual ANTES de limpiar el estado
    if (user) {
      localStorage.removeItem(`cart_items_${user.user_id || user.id}`);
    }

    // Limpiar localStorage
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");

    // Limpiar estado
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);

    console.log("✅ Sesión cerrada - sin redirección automática");
  };

  // Auto-verificación inicial - MEJORADA
  useEffect(() => {
    const verifyTokens = async () => {
      const storedAccess = localStorage.getItem("access");

      if (!storedAccess) {
        console.log("ℹ️ No hay token almacenado");
        setLoading(false);
        return;
      }

      console.log("🔍 Verificando token existente...");

      // ⭐ Primero intentar cargar usuario desde localStorage
      const storedUser = loadUserFromStorage();

      if (isTokenExpired(storedAccess)) {
        console.log("⏰ Token expirado, intentando refrescar...");
        await refreshAccessToken();
      } else {
        console.log("✅ Token válido");
        // Si ya cargamos el usuario de localStorage, no decodificar de nuevo
        if (!storedUser) {
          decodeUser(storedAccess);
        }
      }

      setLoading(false);
    };

    verifyTokens();
  }, []); // Solo al montar

  // ⭐ Sincronizar cuando cambie accessToken o se actualice localStorage
  useEffect(() => {
    if (accessToken && !user) {
      console.log("🔄 Token presente pero sin usuario, cargando...");
      // Intentar cargar desde localStorage primero
      const storedUser = loadUserFromStorage();
      if (!storedUser) {
        decodeUser(accessToken);
      }
    }
  }, [accessToken]);

  // Axios interceptor para refrescar automáticamente
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && refreshToken) {
          console.log("🔄 Error 401, intentando refrescar token...");
          const newAccess = await refreshAccessToken();
          if (newAccess) {
            error.config.headers["Authorization"] = `Bearer ${newAccess}`;
            return axios(error.config);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshToken]);

  const value = {
    user,
    setUser,
    accessToken,
    refreshToken,
    setAccessToken,
    setRefreshToken,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? (
        children
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
            <p className="text-[#5D4037]">Verificando autenticación...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};