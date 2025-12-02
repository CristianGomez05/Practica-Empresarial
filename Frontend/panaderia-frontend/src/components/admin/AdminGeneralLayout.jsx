// Frontend/src/components/admin/AdminGeneralLayout.jsx
// ✨ ESTILO RESPONSIVO IGUAL AL DASHBOARD DE CLIENTE
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHome, FaBox, FaTag, FaShoppingCart, FaUsers, FaChartBar, 
  FaSignOutAlt, FaBars, FaTimes, FaStore 
} from 'react-icons/fa';
import BranchSelector from './BranchSelector';

export default function AdminGeneralLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
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
    { path: '/admin-general', icon: FaHome, label: 'Dashboard', exact: true },
    { path: '/admin-general/sucursales', icon: FaStore, label: 'Sucursales', badge: 'Gestión' },
    { path: '/admin-general/productos', icon: FaBox, label: 'Productos' },
    { path: '/admin-general/ofertas', icon: FaTag, label: 'Ofertas' },
    { path: '/admin-general/pedidos', icon: FaShoppingCart, label: 'Pedidos' },
    { path: '/admin-general/usuarios', icon: FaUsers, label: 'Usuarios' },
    { path: '/admin-general/reportes', icon: FaChartBar, label: 'Reportes' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/95 backdrop-blur-sm border-r border-purple-200/50 shadow-xl">
        {/* Logo */}
        <div className="p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">👑</span>
            </div>
            <div>
              <h2 className="font-bold text-purple-900 text-lg">Admin General</h2>
              <p className="text-xs text-purple-700">Santa Clara</p>
            </div>
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 font-semibold shadow-sm'
                    : 'text-[#6D4C41] hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <Icon className="text-lg" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#E8D5C4]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#5D4037] truncate">
                {user?.first_name || user?.username}
              </p>
              <p className="text-xs text-[#8D6E63] truncate">Admin General</p>
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
              className="text-[#5D4037] text-xl p-2 hover:bg-purple-50 rounded-lg transition-colors"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">👑</span>
              <h1 className="font-bold text-[#5D4037]">Admin General</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge de Admin General */}
            <div className="hidden sm:flex items-center bg-purple-50 px-3 py-1.5 rounded-lg">
              <span className="text-xs font-semibold text-purple-700">
                Acceso Total
              </span>
            </div>

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
              <div className="p-6 border-b border-[#E8D5C4] bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">👑</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-[#5D4037] text-lg">Admin General</h2>
                      <p className="text-xs text-[#8D6E63]">Santa Clara</p>
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
                          ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 font-semibold'
                          : 'text-[#6D4C41] hover:bg-purple-50'
                      }`}
                    >
                      <Icon className="text-lg" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* User Info & Logout */}
              <div className="p-4 border-t border-[#E8D5C4]">
                <div className="flex items-center gap-3 mb-3 px-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#5D4037] truncate">
                      {user?.first_name || user?.username}
                    </p>
                    <p className="text-xs text-[#8D6E63] truncate">Admin General</p>
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

        {/* Top Bar con BranchSelector */}
        <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-purple-800">
                {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Panel Administrativo General'}
              </h2>
              <p className="text-sm text-gray-600">
                Gestión total de todas las sucursales
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <BranchSelector 
                onBranchChange={setSelectedBranch}
                currentBranch={selectedBranch}
              />
              
              <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                <span className="font-semibold">👑 Admin General</span>
              </div>
            </div>
          </div>
        </div>

        {/* BranchSelector para móvil */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <BranchSelector 
            onBranchChange={setSelectedBranch}
            currentBranch={selectedBranch}
          />
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet context={{ selectedBranch }} />
        </main>
      </div>
    </div>
  );
}