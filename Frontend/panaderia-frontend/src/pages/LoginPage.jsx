// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setAccessToken, setRefreshToken } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      console.log("🔐 Intentando login con:", form.username);
      
      const res = await axios.post(`${API_BASE}/core/token/`, {
        username: form.username,
        password: form.password
      });

      console.log("✅ Respuesta del servidor:", res.data);

      const { access, refresh, user: userData } = res.data;

      // Guardar tokens en localStorage
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      // Actualizar el contexto
      setAccessToken(access);
      setRefreshToken(refresh);

      // Decodificar y guardar usuario
      const decoded = jwtDecode(access);
      console.log("🔍 Token decodificado:", decoded);
      console.log("🔍 userData de respuesta:", userData);
      console.log("🔍 Rol en token decodificado:", decoded.rol);
      console.log("🔍 Rol en userData:", userData?.rol);
      
      // Usar userData si está disponible, sino usar decoded
      const userInfo = userData || decoded;
      setUser(userInfo);

      console.log("✅ Usuario guardado en contexto:", userInfo);
      console.log("✅ Rol final del usuario:", userInfo.rol);

      // Redirigir según rol
      if (userInfo.rol === 'administrador') {
        console.log("👑 Administrador detectado, redirigiendo a /admin");
        navigate("/admin");
      } else {
        console.log("👤 Cliente detectado, redirigiendo a /dashboard/inicio");
        navigate("/dashboard/inicio");
      }
    } catch (err) {
      console.error("❌ Error en login:", err);
      console.error("❌ Respuesta de error:", err.response?.data);
      
      if (err.response?.status === 401) {
        setError("Usuario o contraseña incorrectos");
      } else if (err.response?.status === 400) {
        setError("Por favor ingresa usuario y contraseña");
      } else {
        setError("Error de conexión. Verifica que el servidor esté corriendo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 px-4">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8 space-y-6 border-2 border-amber-100">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🥐</span>
          </div>
          <h2 className="text-3xl font-bold text-[#5C4033] mb-2">
            Bienvenido
          </h2>
          <p className="text-[#8D6E63]">Panadería Santa Clara</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5C4033] mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="Ingresa tu usuario"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5C4033] mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="********"
              required
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Iniciando sesión...
              </span>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm font-medium">O continúa con</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Google Login */}
        <GoogleLoginButton />

        {/* Info Footer */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{" "}
            <span className="text-amber-700 cursor-pointer hover:underline font-semibold">
              Contáctanos
            </span>
          </p>
        </div>
      </div>

      {/* Debug Info (remover en producción) */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Endpoint: {API_BASE}/core/token/</p>
      </div>
    </div>
  );
}