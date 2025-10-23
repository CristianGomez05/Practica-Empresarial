// src/components/dashboard/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Inicio" },
  { to: "/dashboard/pedidos", label: "Mis pedidos" },
  { to: "/dashboard/carrito", label: "Carrito" },
  { to: "/dashboard/ofertas", label: "Ofertas" },
  { to: "/dashboard/perfil", label: "Mi perfil" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 hidden md:block bg-white border-r">
      <div className="p-6 font-bold text-xl text-[#5C4033]">Mi cuenta</div>
      <nav className="p-6 space-y-2">
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            className={({ isActive }) =>
              `block px-4 py-2 rounded ${isActive ? "bg-[#f3e6da] text-[#8B4513]" : "text-[#4b2e05] hover:bg-[#fff1e0]"}`
            }
            end
          >
            {i.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
