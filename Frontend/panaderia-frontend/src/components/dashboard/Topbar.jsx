// src/components/dashboard/Topbar.jsx
import React, { useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import LoginButton from "../auth/LoginButton";

export default function Topbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-white">
      <div className="text-xl font-semibold text-[#5C4033]">Panel del cliente</div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="text-sm text-[#4b2e05]">Hola, {user.username}</div>
            <button onClick={logout} className="text-sm text-[#8B4513]">
              Cerrar sesión
            </button>
          </>
        ) : (
          <LoginButton />
        )}
      </div>
    </header>
  );
}
