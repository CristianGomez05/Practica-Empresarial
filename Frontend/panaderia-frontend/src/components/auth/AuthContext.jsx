// src/components/auth/AuthContext.jsx - CON SOPORTE COMPLETO PARA DOMICILIO
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("access"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refresh"));
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // ⭐ ACTUALIZADO: Cargar usuario desde localStorage con domicilio
  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("📦 Usuario cargado desde localStorage:", parsedUser.username);
        console.log("🏠 Domicilio:", parsedUser.domicilio ? `${parsedUser.domicilio.substring(0, 50)}...` : "No configurado");
        return parsedUser;
      } catch (error) {
        console.error("❌ Error parseando usuario de localStorage:", error);
        localStorage.removeItem("user");
        return null;
      }
    }
    return null;
  };

  // ⭐ ACTUALIZADO: Función para guardar usuario con domicilio
  const setUser = (userData) => {
    console.log('\n' + '='.repeat(60));
    console.log('💾 AuthContext: setUser() llamado');
    
    if (userData) {
      // ⭐ CRÍTICO: Asegurar que domicilio siempre existe
      const userToSave = {
        ...userData,
        domicilio: userData.domicilio || '',
        tiene_domicilio: userData.tiene_domicilio || (userData.domicilio && userData.domicilio.trim().length > 0)
      };
      
      console.log('👤 Usuario:', userToSave.username);
      console.log('🏠 Domicilio:', userToSave.domicilio ? `${userToSave.domicilio.substring(0, 50)}...` : 'No configurado');
      console.log('✓ Tiene domicilio:', userToSave.tiene_domicilio);
      
      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(userToSave));
      console.log('✅ Usuario guardado en localStorage');
      
      // Actualizar estado
      setUserState(userToSave);
      console.log('✅ Estado actualizado');
    } else {
      console.log('🗑️ Limpiando usuario');
      localStorage.removeItem('user');
      setUserState(null);
    }
    
    console.log('='.repeat(60) + '\n');
  };

  // ⭐ ACTUALIZADO: Decodificar token con domicilio
  const decodeUser = (token) => {
    try {
      const decoded = jwtDecode(token);
      console.log("🔍 Token decodificado:", decoded);
      
      // Intentar cargar datos completos desde localStorage primero
      const storedUser = loadUserFromStorage();
      
      // Si hay datos en localStorage con el mismo ID, usarlos (tienen más información)
      if (storedUser && storedUser.id === (decoded.user_id || decoded.id)) {
        console.log("✅ Usando datos completos desde localStorage");
        setUserState(storedUser);
        return storedUser;
      }
      
      // ⭐ CRÍTICO: Si no, usar datos del token incluyendo domicilio
      const userFromToken = {
        id: decoded.user_id || decoded.id,
        username: decoded.username,
        email: decoded.email,
        first_name: decoded.first_name || '',
        last_name: decoded.last_name || '',
        rol: decoded.rol,
        sucursal_id: decoded.sucursal_id || null,
        sucursal_nombre: decoded.sucursal_nombre || null,
        avatar: decoded.avatar || null,
        domicilio: decoded.domicilio || '',  // ⭐ NUEVO
        tiene_domicilio: decoded.tiene_domicilio || false  // ⭐ NUEVO
      };
      
      console.log("✅ Usuario desde token:", userFromToken.username);
      console.log("🏠 Domicilio desde token:", userFromToken.domicilio || 'No configurado');
      
      // Guardar usando setUser para persistir en localStorage
      setUser(userFromToken);
      return userFromToken;
    } catch (error) {
      console.error("❌ Error al decodificar token:", error);
      setUserState(null);
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

  // ⭐ ACTUALIZADO: Refrescar token y usuario
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
      
      // ⭐ Decodificar con domicilio
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
    
    // ⭐ Limpiar el carrito del usuario actual ANTES de limpiar el estado
    if (user) {
      const userId = user.user_id || user.id;
      localStorage.removeItem(`cart_user_${userId}`);
      console.log(`🧹 Carrito limpiado: cart_user_${userId}`);
    }

    // Limpiar localStorage
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");

    // Limpiar estado
    setAccessToken(null);
    setRefreshToken(null);
    setUserState(null);

    console.log("✅ Sesión cerrada - sin redirección automática");
  };

  // ⭐⭐⭐ CRÍTICO: Auto-verificación inicial MEJORADA
  useEffect(() => {
    const verifyTokens = async () => {
      const storedAccess = localStorage.getItem("access");

      // ⭐ Si estamos en /dashboard y hay un hash con tokens OAuth, NO hacer nada
      // Dejar que Dashboard.jsx procese los tokens primero
      if (window.location.pathname === '/dashboard' && window.location.hash.includes('access=')) {
        console.log("🔐 Detectado OAuth en /dashboard, esperando a que Dashboard procese tokens...");
        setLoading(false);
        return;
      }

      if (!storedAccess) {
        console.log("ℹ️ No hay token almacenado");
        setLoading(false);
        return;
      }

      console.log("🔍 Verificando token existente...");

      // ⭐ Primero intentar cargar usuario desde localStorage
      const storedUser = loadUserFromStorage();
      
      if (storedUser) {
        console.log("✅ Usuario cargado desde storage");
        setUserState(storedUser);
      }

      if (isTokenExpired(storedAccess)) {
        console.log("⏰ Token expirado, intentando refrescar...");
        await refreshAccessToken();
      } else {
        console.log("✅ Token válido");
        // Si no hay usuario en storage, decodificar del token
        if (!storedUser) {
          decodeUser(storedAccess);
        }
      }

      setLoading(false);
    };

    verifyTokens();
  }, []); // Solo al montar

  // ⭐ ACTUALIZADO: Sincronizar cuando cambie accessToken
  useEffect(() => {
    if (accessToken && !user) {
      console.log("🔄 Token presente pero sin usuario, cargando...");
      // Intentar cargar desde localStorage primero
      const storedUser = loadUserFromStorage();
      if (storedUser) {
        setUserState(storedUser);
      } else {
        decodeUser(accessToken);
      }
    }
  }, [accessToken]);

  // ⭐ NUEVO: Sincronizar cambios del localStorage entre pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          console.log('🔄 Usuario actualizado desde otra pestaña:', updatedUser.username);
          console.log('🏠 Domicilio sincronizado:', updatedUser.domicilio || 'No configurado');
          setUserState(updatedUser);
        } catch (error) {
          console.error('❌ Error sincronizando usuario:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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