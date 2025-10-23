import React from "react";
import { FaGoogle } from "react-icons/fa";

export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const googleLoginUrl = `${backendUrl}/accounts/google/login/?process=login`;

      console.log("🔗 Redirigiendo a Google OAuth en:", googleLoginUrl);
      window.location.href = googleLoginUrl;
    } catch (error) {
      console.error("💥 Error al intentar iniciar sesión con Google:", error);
      alert("Hubo un problema al iniciar sesión con Google. Revisa la consola.");
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center justify-center gap-2 bg-[#D2691E] text-white px-5 py-2.5 rounded-full font-semibold shadow-md hover:bg-[#8B4513] transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#F4A460] focus:ring-offset-2 w-full"
    >
      <FaGoogle className="text-white text-lg" />
      <span>Iniciar con Google</span>
    </button>
  );
}
