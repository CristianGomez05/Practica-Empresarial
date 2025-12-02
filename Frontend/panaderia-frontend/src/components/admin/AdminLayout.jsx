// Frontend/src/components/admin/AdminLayout.jsx
// 🔒 EXCLUSIVO PARA ADMINISTRADOR REGULAR DE SUCURSAL
// ✨ ESTILO RESPONSIVO IGUAL AL DASHBOARD DE CLIENTE
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaHome, FaBox, FaTag, FaShoppingCart, FaChartBar,
  FaSignOutAlt, FaBars, FaTimes, FaStore
} from 'react-icons/fa';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    
    if (userData?.rol === 'administrador') {
      console.log('🔒 Admin Regular - Sucursal asignada:', userData.sucursal_nombre);
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const menuItems = [
    { path: '/admin', icon: FaHome, label: 'Dashboard', exact: true },
    { path: '/admin/productos', icon: FaBox, label: 'Productos' },
    { path: '/admin/ofertas', icon: FaTag, label: 'Ofertas' },
    { path: '/admin/pedidos', icon: FaShoppingCart, label: 'Pedidos' },
    { path: '/admin/reportes', icon: FaChartBar, label: 'Reportes' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

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
              <h2 className="font-bold text-amber-900 text-lg">Admin Panel</h2>
              <p className="text-xs text-amber-700">Sucursal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 font-semibold shadow-sm'
                    : 'text-[#6D4C41] hover:bg-[#FFF8F0] hover:text-amber-700'
                }`}
              >
                <Icon className="text-lg" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#E8D5C4]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#5D4037] truncate">
                {user?.first_name || user?.username}
              </p>
              <p className="text-xs text-[#8D6E63] truncate">
                {user?.sucursal_nombre || 'Administrador'}
              </p>
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
              className="text-[#5D4037] text-xl p-2 hover:bg-amber-50 rounded-lg transition-colors"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🥐</span>
              <h1 className="font-bold text-[#5D4037]">Admin Panel</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Info de Sucursal en móvil */}
            {user?.sucursal_nombre && (
              <div className="hidden sm:flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                <FaStore className="text-purple-600 text-sm" />
                <span className="text-xs font-semibold text-purple-700">
                  {user.sucursal_nombre}
                </span>
              </div>
            )}

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
              <div className="p-6 border-b border-[#E8D5C4] bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">🥐</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-[#5D4037] text-lg">Admin Panel</h2>
                      <p className="text-xs text-[#8D6E63]">Sucursal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-[#8D6E63] hover:text-[#5D4037] p-1"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path, item.exact);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        active
                          ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 font-semibold'
                          : 'text-[#6D4C41] hover:bg-[#FFF8F0]'
                      }`}
                    >
                      <Icon className="text-lg" />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* User Info & Logout */}
              <div className="p-4 border-t border-[#E8D5C4]">
                <div className="flex items-center gap-3 mb-3 px-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#5D4037] truncate">
                      {user?.first_name || user?.username}
                    </p>
                    <p className="text-xs text-[#8D6E63] truncate">
                      {user?.sucursal_nombre || 'Administrador'}
                    </p>
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
          <Outlet context={{ 
            selectedBranch: user?.sucursal_id || null,
            branchName: user?.sucursal_nombre || null
          }} />
        </main>
      </div>
    </div>
  );
}