// Frontend/src/pages/LoginPage.jsx
// ⭐ ACTUALIZADO: Con enlace "Olvidé mi contraseña"

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";
import { useSnackbar } from "notistack";
import axios from "axios";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setAccessToken, setRefreshToken } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  // Detectar si viene de cancelación de OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cancelled') === 'true') {
      enqueueSnackbar('Has cancelado el inicio de sesión. Puedes intentar nuevamente.', { 
        variant: 'info',
        autoHideDuration: 3000 
      });
      window.history.replaceState({}, '', '/login');
    }
  }, [enqueueSnackbar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      console.log("🔐 Intentando login con:", form.username);
      
      const res = await axios.post(`${API_BASE}/api/token/`, {
        username: form.username,
        password: form.password
      });

      const { access, refresh, user: userData } = res.data;

      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);

      setAccessToken(access);
      setRefreshToken(refresh);

      const userInfo = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        rol: userData.rol,
        domicilio: userData.domicilio || null,
        tiene_domicilio: userData.tiene_domicilio || false,
        sucursal_id: userData.sucursal_id,
        sucursal_nombre: userData.sucursal_nombre,
        sucursal: userData.sucursal_id
      };
      
      localStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);

      enqueueSnackbar(`¡Bienvenido ${userInfo.first_name || userInfo.username}!`, { 
        variant: 'success',
        autoHideDuration: 2000 
      });

      if (userInfo.rol === 'administrador_general') {
        navigate("/admin-general");
      } else if (userInfo.rol === 'administrador') {
        navigate("/admin");
      } else {
        navigate("/dashboard/inicio");
      }
    } catch (err) {
      console.error("❌ Error en login:", err);
      
      if (err.response?.status === 401) {
        setError("Usuario o contraseña incorrectos");
        enqueueSnackbar("Credenciales incorrectas", { variant: 'error' });
      } else if (err.response?.status === 400) {
        setError("Por favor ingresa usuario y contraseña");
        enqueueSnackbar("Completa todos los campos", { variant: 'warning' });
      } else {
        setError("Error de conexión. Verifica que el servidor esté corriendo.");
        enqueueSnackbar("Error de conexión con el servidor", { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFE4CC] to-[#FFDAB9] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🥐</span>
          </div>
          <h1 className="text-4xl font-bold text-[#5D4037] mb-2">¡Bienvenido!</h1>
          <p className="text-[#6D4C41]">Inicia sesión en Panadería Santa Clara</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-shake">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#5D4037] mb-2">
              Usuario o Email
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-3 border-2 border-[#D2B48C] rounded-lg focus:ring-2 focus:ring-[#D2691E] focus:border-transparent transition-all"
              placeholder="usuario@ejemplo.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#5D4037]">
                Contraseña
              </label>
              {/* ⭐⭐⭐ NUEVO: Enlace Olvidé mi contraseña */}
              <Link
                to="/olvide-password"
                className="text-xs text-[#D2691E] hover:text-[#8B4513] font-semibold transition-colors hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border-2 border-[#D2B48C] rounded-lg focus:ring-2 focus:ring-[#D2691E] focus:border-transparent transition-all"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-[#D2B48C]"></div>
          <span className="text-sm text-[#6D4C41] font-medium">o</span>
          <div className="flex-1 h-px bg-[#D2B48C]"></div>
        </div>

        {/* Google Login */}
        <GoogleLoginButton />

        {/* Register Link */}
        <p className="text-center text-sm text-[#6D4C41] mt-6">
          ¿No tienes cuenta?{" "}
          <Link
            to="/register"
            className="text-[#D2691E] font-semibold hover:text-[#8B4513] transition-colors underline-offset-2 hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link
            to="/"
            className="text-sm text-[#6D4C41] hover:text-[#5D4037] transition-colors inline-flex items-center gap-1"
          >
            <span>←</span>
            <span>Volver al inicio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}