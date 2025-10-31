// src/components/dashboard/DashboardLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../../hooks/useCart";
import {
  FaHome,
  FaBox,
  FaTag,
  FaShoppingCart,
  FaClipboardList,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes
} from "react-icons/fa";

export default function DashboardLayout() {
  const { user, logout, accessToken } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/"); // Redirige a la Landing Page
  };

  const cartItemCount = items.reduce((sum, item) => sum + (item.qty || 1), 0);

  const menuItems = [
    { to: "/dashboard/inicio", icon: FaHome, label: "Inicio" },
    { to: "/dashboard/productos", icon: FaBox, label: "Productos" },
    { to: "/dashboard/ofertas", icon: FaTag, label: "Ofertas" },
    { to: "/dashboard/carrito", icon: FaShoppingCart, label: "Carrito", badge: cartItemCount },
    { to: "/dashboard/pedidos", icon: FaClipboardList, label: "Mis Pedidos" },
    { to: "/dashboard/perfil", icon: FaUser, label: "Mi Perfil" },

    // Menú de administrador (solo visible si es admin)
    ...(user?.rol === 'administrador' ? [
      {
        to: "/dashboard/admin/ofertas",
        icon: FaTag,
        label: "⚡ Admin Ofertas",
        isAdmin: true
      }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/95 backdrop-blur-sm border-r border-amber-200/50 shadow-xl">
        {/* Logo */}
        <div className="p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">🥐</span>
            </div>
            <div>
              <h2 className="font-bold text-amber-900 text-lg">Panadería</h2>
              <p className="text-xs text-amber-700">Santa Clara</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                  ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 font-semibold shadow-sm"
                  : "text-[#6D4C41] hover:bg-[#FFF8F0] hover:text-amber-700"
                } ${item.isAdmin ? 'border-l-4 border-orange-500' : ''}`
              }
            >
              <item.icon className="text-lg" />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#E8D5C4]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#5D4037] truncate">
                {user?.username || "Usuario"}
              </p>
              <p className="text-xs text-[#8D6E63] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FaSignOutAlt />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-[#E8D5C4] px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-[#5D4037] text-xl"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h1 className="font-bold text-[#5D4037]">Panadería Santa Clara 🥐</h1>
          </div>
          <div className="flex items-center gap-3">
            <NavLink
              to="/dashboard/carrito"
              className="relative text-amber-700 text-xl"
            >
              <FaShoppingCart />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </NavLink>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
            <aside
              className="w-64 h-full bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#E8D5C4]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">🥐</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-[#5D4037] text-lg">Panadería</h2>
                    <p className="text-xs text-[#8D6E63]">Santa Clara</p>
                  </div>
                </div>
              </div>

              <nav className="p-4 space-y-1">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                        ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 font-semibold"
                        : "text-[#6D4C41] hover:bg-[#FFF8F0]"
                      }`
                    }
                  >
                    <item.icon className="text-lg" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div className="absolute bottom-0 w-full p-4 border-t border-[#E8D5C4]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg"
                >
                  <FaSignOutAlt />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}