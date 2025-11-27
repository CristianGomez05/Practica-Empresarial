// Frontend/src/components/admin/AdminGeneralLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHome, FaBox, FaTag, FaShoppingCart, FaUsers, FaChartBar, 
  FaSignOutAlt, FaBars, FaTimes, FaStore 
} from 'react-icons/fa';

export default function AdminGeneralLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? '280px' : '80px' }}
        className="fixed left-0 top-0 h-screen bg-gradient-to-b from-purple-700 to-purple-900 text-white shadow-2xl z-50"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">🥐</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">Admin General</h1>
                  <p className="text-xs text-purple-200">Santa Clara</p>
                </div>
              </motion.div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-auto"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          {/* User Info */}
          {sidebarOpen && user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                  {user.first_name?.charAt(0) || user.username?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="font-semibold">{user.first_name || user.username}</p>
                  <p className="text-xs text-purple-200">Admin General</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-200 mt-2 pt-2 border-t border-white/20">
                <span className="px-2 py-1 bg-purple-500 rounded-full">🌟 Acceso Total</span>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <Icon className={`text-xl ${!sidebarOpen && 'mx-auto'}`} />
                  {sidebarOpen && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="text-xs bg-purple-500 px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all mt-8"
          >
            <FaSignOutAlt className={`text-xl ${!sidebarOpen && 'mx-auto'}`} />
            {sidebarOpen && <span className="font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div
        style={{
          marginLeft: sidebarOpen ? '280px' : '80px',
          transition: 'margin-left 0.3s ease',
        }}
        className="min-h-screen"
      >
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
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
              <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                <span className="font-semibold">👑 Admin General</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {/* ⭐ Proporcionar contexto para componentes hijos */}
          <Outlet context={{ selectedBranch: null }} />
        </div>
      </div>
    </div>
  );
}