import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../components/auth/AuthContext";
import api from "../services/api";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Manejar login con usuario y contraseña ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login/", form);
      const { access, refresh, user } = res.data;

      // Guardar tokens
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      // Guardar usuario en contexto
      setUser(user);

      // Redirigir al dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Credenciales incorrectas o error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#fffaf0] px-4">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-md p-8 space-y-6 border border-[#f2d7b6]">
        <h2 className="text-2xl font-bold text-center text-[#5C4033]">
          Bienvenido a Panadería Dulce Aroma
        </h2>

        {/* Opción 1: Login con usuario/contraseña */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5C4033] mb-1">
              Correo o usuario
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5C4033] mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="********"
              required
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-700 text-white font-medium py-2 rounded hover:bg-amber-800 transition"
          >
            {loading ? "Iniciando sesión..." : "Ingresar"}
          </button>
        </form>

        {/* Separador */}
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">O continúa con</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Opción 2: Login con Google */}
        <div className="flex justify-center">
          <GoogleLoginButton />
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          ¿No tienes cuenta? <span className="text-amber-700 cursor-pointer hover:underline">Regístrate aquí</span>
        </p>
      </div>
    </div>
  );
}
