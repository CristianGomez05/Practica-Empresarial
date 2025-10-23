// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../components/auth/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes("access=") || hash.includes("refresh="))) {
      const fragment = hash.substring(1);
      const params = new URLSearchParams(fragment);
      const access = params.get("access");
      const refresh = params.get("refresh");

      if (access) localStorage.setItem("access", access);
      if (refresh) localStorage.setItem("refresh", refresh);

      const cleanUrl =
        window.location.origin + window.location.pathname + window.location.search;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    setProcessing(false);
  }, []);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Cargando sesión...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6">
      <h1 className="text-2xl font-bold text-[#5D4037]">
        Bienvenido, {user?.username || "Cliente"} 🥐
      </h1>
      <p className="mt-2 text-[#6D4C41]">
        Has iniciado sesión correctamente mediante Google.
      </p>

      <button
        onClick={logout}
        className="mt-4 bg-[#D84315] text-white px-4 py-2 rounded hover:bg-[#BF360C]"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
