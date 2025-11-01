// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: ""
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    
    try {
      console.log("📝 Intentando registro con:", form.username);
      
      const res = await axios.post(`${API_BASE}/core/registro/`, {
        username: form.username,
        email: form.email,
        password: form.password,
        password_confirm: form.password_confirm,
        first_name: form.first_name,
        last_name: form.last_name
      });

      console.log("✅ Usuario registrado:", res.data);

      // Mostrar mensaje de éxito y redirigir al login
      alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
      navigate("/login");
      
    } catch (err) {
      console.error("❌ Error en registro:", err);
      console.error("❌ Respuesta de error:", err.response?.data);
      
      if (err.response?.data) {
        // Manejar errores específicos del backend
        setErrors(err.response.data);
      } else {
        setErrors({
          general: "Error de conexión. Verifica que el servidor esté corriendo."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 px-4 py-8">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl p-8 space-y-6 border-2 border-amber-100">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🥐</span>
          </div>
          <h2 className="text-3xl font-bold text-[#5C4033] mb-2">
            Crear Cuenta
          </h2>
          <p className="text-[#8D6E63]">Panadería Santa Clara</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error General */}
          {errors.general && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          {/* Nombre y Apellido en una fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5C4033] mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className={`w-full border-2 ${errors.first_name ? 'border-red-300' : 'border-gray-200'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all`}
                placeholder="Juan"
                required
                disabled={loading}
              />
              {errors.first_name && (
                <p className="text-red-600 text-xs mt-1">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C4033] mb-2">
                Apellido *
              </label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className={`w-full border-2 ${errors.last_name ? 'border-red-300' : 'border-gray-200'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all`}
                placeholder="Pérez"
                required
                disabled={loading}
              />
              {errors.last_name && (
                <p className="text-red-600 text-xs mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Usuario */}
          <div>
            <label className="block text-sm font-medium text-[#5C4033] mb-2">
              Usuario *
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className={`w-full border-2 ${errors.username ? 'border-red-300' : 'border-gray-200'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all`}
              placeholder="juanperez123"
              required
              disabled={loading}
            />
            {errors.username && (
              <p className="text-red-600 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#5C4033] mb-2">
              Correo Electrónico *
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={`w-full border-2 ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all`}
              placeholder="correo@ejemplo.com"
              required
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-[#5C4033] mb-2">
              Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`w-full border-2 ${errors.password ? 'border-red-300' : 'border-gray-200'} rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all`}
                placeholder="Mínimo 8 caracteres"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors p-1 rounded"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5"
                >
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  )}
                  {!showPassword && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                </svg>
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-xs mt-1">{errors.password}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Debe contener al menos 8 caracteres, una letra y un número
            </p>
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-sm font-medium text-[#5C4033] mb-2">
              Confirmar Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPasswordConfirm ? "text" : "password"}
                name="password_confirm"
                value={form.password_confirm}
                onChange={handleChange}
                className={`w-full border-2 ${errors.password_confirm ? 'border-red-300' : 'border-gray-200'} rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all`}
                placeholder="Repite tu contraseña"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors p-1 rounded"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5"
                >
                  {showPasswordConfirm ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  )}
                  {!showPasswordConfirm && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                </svg>
              </button>
            </div>
            {errors.password_confirm && (
              <p className="text-red-600 text-xs mt-1">{errors.password_confirm}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creando cuenta...
              </span>
            ) : (
              "Crear Cuenta"
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <Link 
              to="/login" 
              className="text-amber-700 hover:text-amber-800 font-semibold hover:underline"
            >
              Inicia Sesión
            </Link>
          </p>
        </div>
      </div>

      {/* Debug Info (remover en producción) */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Endpoint: {API_BASE}/core/registro/</p>
      </div>
    </div>
  );
}