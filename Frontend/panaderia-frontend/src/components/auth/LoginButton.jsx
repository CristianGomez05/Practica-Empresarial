import React from "react";
import { FaGoogle } from "react-icons/fa";

export default function LoginButton() {
  const handleGoogle = () => {
    window.location.href = `${
      import.meta.env.VITE_API_URL || "http://localhost:8000"
    }/accounts/google/login/`;
  };

  return (
    <button
      onClick={handleGoogle}
      className="flex items-center justify-center gap-2 bg-[#D2691E] text-white px-5 py-2.5 rounded-full font-semibold shadow-md hover:bg-[#8B4513] transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#F4A460] focus:ring-offset-2"
    >
      <FaGoogle className="text-white text-lg" />
      <span>Iniciar con Google</span>
    </button>
  );
}
