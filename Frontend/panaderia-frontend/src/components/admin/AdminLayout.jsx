// Frontend/src/components/admin/AdminLayout.jsx
import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { 
  FaHome, FaBox, FaTag, FaClipboardList, FaUsers, 
  FaSignOutAlt, FaBars, FaTimes, FaChartBar
} from "react-icons/fa";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    // Primero navega
    navigate("/", { replace: true });
    // Luego hace logout (después de un pequeño delay para asegurar navegación)
    setTimeout(() => {
      logout();
    }, 100);
  };

  const menuItems = [
    { to: "/admin", icon: FaHome, label: "Dashboard", end: true },
    { to: "/admin/productos", icon: FaBox, label: "Productos" },
    { to: "/admin/ofertas", icon: FaTag, label: "Ofertas" },
    { to: "/admin/pedidos", icon: FaClipboardList, label: "Pedidos" },
    { to: "/admin/usuarios", icon: FaUsers, label: "Usuarios" },
    { to: "/admin/reportes", icon: FaChartBar, label: "Reportes" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 shadow-2xl">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">🥐</span>
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Admin Panel</h2>
              <p className="text-xs text-gray-400">Panadería Santa Clara</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-lg"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <item.icon className="text-lg" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.username || "Admin"}
              </p>
              <p className="text-xs text-gray-400 truncate">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            <FaSignOutAlt />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-700 text-xl"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h1 className="font-bold text-gray-800">Admin Panel 🥐</h1>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" 
            onClick={() => setSidebarOpen(false)}
          >
            <aside
              className="w-64 h-full bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Logo Mobile */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">🥐</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-lg">Admin Panel</h2>
                    <p className="text-xs text-gray-400">Panadería Santa Clara</p>
                  </div>
                </div>
              </div>

              {/* Navigation Mobile */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold"
                          : "text-gray-300 hover:bg-gray-700"
                      }`
                    }
                  >
                    <item.icon className="text-lg" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* Mobile User Info & Logout */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center gap-3 mb-3 px-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.username?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.username || "Admin"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">Administrador</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
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