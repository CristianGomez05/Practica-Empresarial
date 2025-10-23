// src/components/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // ✅ corrección del import

// 🔹 Creamos y exportamos el contexto directamente
export const AuthContext = createContext();

// 🔹 Hook de conveniencia
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("access"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refresh"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // --- Decodificar token y setear usuario ---
  const decodeUser = (token) => {
    try {
      const decoded = jwtDecode(token);
      setUser(decoded);
    } catch {
      setUser(null);
    }
  };

  // --- Verificar expiración del token ---
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // --- Refrescar token automáticamente ---
  const refreshAccessToken = async () => {
    if (!refreshToken) return logout();
    try {
      const response = await axios.post(`${API_BASE}/api/token/refresh/`, {
        refresh: refreshToken,
      });
      const newAccess = response.data.access;
      localStorage.setItem("access", newAccess);
      setAccessToken(newAccess);
      decodeUser(newAccess);
      return newAccess;
    } catch (error) {
      console.error("⚠️ Error al refrescar token:", error);
      logout();
    }
  };

  // --- Logout limpio ---
  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  // --- Auto-verificación inicial al cargar la app ---
  useEffect(() => {
    const verifyTokens = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      if (isTokenExpired(accessToken)) {
        await refreshAccessToken();
      } else {
        decodeUser(accessToken);
      }
      setLoading(false);
    };

    verifyTokens();
  }, []);

  // --- Axios interceptor para refrescar automáticamente ---
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && refreshToken) {
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
        <div className="min-h-screen flex items-center justify-center">
          <div>Verificando autenticación...</div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
