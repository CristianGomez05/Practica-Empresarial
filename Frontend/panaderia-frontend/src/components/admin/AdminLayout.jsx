// src/components/admin/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  FaHome,
  FaBox,
  FaTag,
  FaClipboardList,
  FaUsers,
  FaChartBar,
  FaSignOutAlt,
  FaBars,
  FaTimes
} from "react-icons/fa";

export default function AdminLayout() {
  const { user, logout, accessToken } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Verificar autenticación y rol de administrador
  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    } else if (user?.rol !== 'administrador') {
      navigate("/dashboard", { replace: true });
    }
  }, [accessToken, user, navigate]);

  const handleLogout = () => {
    navigate("/", { replace: true });
    setTimeout(() => {
      logout();
    }, 100);
  };

  const menuItems = [
    { to: "/dashboard/admin/inicio", icon: FaHome, label: "Inicio" },
    { to: "/dashboard/admin/productos", icon: FaBox, label: "Productos" },
    { to: "/dashboard/admin/ofertas", icon: FaTag, label: "Ofertas" },
    { to: "/dashboard/admin/pedidos", icon: FaClipboardList, label: "Pedidos" },
    { to: "/dashboard/admin/usuarios", icon: FaUsers, label: "Usuarios" },
    { to: "/dashboard/admin/reportes", icon: FaChartBar, label: "Reportes" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/95 backdrop-blur-sm border-r border-purple-200/50 shadow-xl">
        {/* Logo */}
        <div className="p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">⚡</span>
            </div>
            <div>
              <h2 className="font-bold text-purple-900 text-lg">Admin Panel</h2>
              <p className="text-xs text-purple-700">Sucursal</p>
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
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 font-semibold shadow-sm"
                    : "text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                }`
              }
            >
              <item.icon className="text-lg" />
              <span className="flex-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-purple-100">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user?.username || "Admin"}
              </p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
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
        <header className="lg:hidden bg-white border-b border-purple-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-purple-900 text-xl p-2 hover:bg-purple-50 rounded-lg transition-colors"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <h1 className="font-bold text-purple-900">Admin</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <FaSignOutAlt />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
            <aside
              className="w-64 h-full bg-white shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Logo */}
              <div className="p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">⚡</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-purple-900 text-lg">Admin Panel</h2>
                      <p className="text-xs text-purple-700">Sucursal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-gray-600 hover:text-gray-800 p-1"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 font-semibold"
                          : "text-gray-700 hover:bg-purple-50"
                      }`
                    }
                  >
                    <item.icon className="text-lg" />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* User Info & Logout */}
              <div className="p-4 border-t border-purple-100">
                <div className="flex items-center gap-3 mb-3 px-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.username?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user?.username || "Admin"}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
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