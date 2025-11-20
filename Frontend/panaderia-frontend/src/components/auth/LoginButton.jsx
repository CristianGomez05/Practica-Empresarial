// Frontend/panaderia-frontend/src/components/auth/LoginButton.jsx
import React from "react";
import { FaGoogle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function LoginButton() {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    // ✅ CORRECTO: Usar navigate en lugar de hardcodear URL
    navigate("/login");
  };

  return (
    <button
      onClick={handleLoginRedirect}
      className="flex items-center justify-center gap-2 bg-[#D2691E] text-white px-5 py-2.5 rounded-full font-semibold shadow-md hover:bg-[#8B4513] transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#F4A460] focus:ring-offset-2"
    >
      <FaGoogle className="text-white text-lg" />
      <span>Iniciar sesión</span>
    </button>
  );
}