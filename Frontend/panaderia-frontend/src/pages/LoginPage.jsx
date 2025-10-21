import React, { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { useSnackbar } from "notistack";

export default function LoginPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/accounts/google/login/`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      enqueueSnackbar("Por favor complete todos los campos", {
        variant: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        enqueueSnackbar("Inicio de sesión exitoso", { variant: "success" });
      } else {
        enqueueSnackbar("Credenciales incorrectas", { variant: "error" });
      }
    } catch (error) {
      enqueueSnackbar("Error de conexión al servidor", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#fff8f0] to-[#f1d7b2] p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center border border-[#deb887]">
        <h2 className="text-3xl font-bold text-[#5c3b1e] mb-6">Bienvenido</h2>

        {/* --- Botón Google --- */}
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 bg-[#D2691E] text-white px-5 py-3 rounded-full w-full font-medium shadow-md hover:bg-[#8B4513] transition-all duration-300 hover:scale-105 mb-6"
        >
          <FaGoogle className="text-lg" />
          Iniciar con Google
        </button>

        {/* --- Separador --- */}
        <div className="flex items-center my-4">
          <hr className="flex-grow border-[#deb887]" />
          <span className="px-2 text-[#8b5a2b] text-sm">O</span>
          <hr className="flex-grow border-[#deb887]" />
        </div>

        {/* --- Formulario tradicional --- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-[#deb887] rounded-md px-4 py-2 focus:ring-2 focus:ring-[#D2691E] outline-none"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#deb887] rounded-md px-4 py-2 focus:ring-2 focus:ring-[#D2691E] outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#8B4513] text-white font-semibold py-2 w-full rounded-md hover:bg-[#5C3317] transition-all duration-300"
          >
            {loading ? "Cargando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
