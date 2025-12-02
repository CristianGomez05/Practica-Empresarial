// Frontend/src/components/admin/AdminLayout.jsx
// 🔒 EXCLUSIVO PARA ADMINISTRADOR REGULAR DE SUCURSAL
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome, FaBox, FaTag, FaShoppingCart, FaChartBar,
  FaSignOutAlt, FaBars, FaTimes, FaStore
} from 'react-icons/fa';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // ⭐ Nuevo estado para móvil
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    
    // Log para debugging
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

  // 📌 Menú EXCLUSIVO para Admin Regular (SIN Usuarios, SIN Sucursales)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ⭐ MOBILE HEADER - Solo visible en < lg (1024px) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-700 to-orange-800 text-white shadow-lg z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
          
          <div className="flex items-center gap-2">
            <FaStore className="text-lg" />
            <h1 className="font-bold text-base sm:text-lg">Admin Panel</h1>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="text-lg" />
          </button>
        </div>
      </header>

      {/* ⭐ MOBILE SIDEBAR - Overlay cuando mobileMenuOpen es true */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Sidebar móvil */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-amber-700 to-orange-800 text-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="flex flex-col h-full p-4">
                {/* Header con Close */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <FaStore className="text-2xl text-amber-200" />
                    </div>
                    <div>
                      <h1 className="font-bold text-lg">Admin Panel</h1>
                      <p className="text-xs text-amber-200">Sucursal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Info del Usuario */}
                {user && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                        {user.first_name?.[0] || user.username?.[0] || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {user.first_name || user.username}
                        </p>
                        <p className="text-xs text-amber-200 truncate">
                          Administrador
                        </p>
                      </div>
                    </div>
                    
                    {user.sucursal_nombre && (
                      <div className="flex items-center gap-2 text-xs text-amber-200 mt-3 pt-3 border-t border-white/20">
                        <FaStore />
                        <span className="truncate font-medium">{user.sucursal_nombre}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <nav className="space-y-2 flex-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path, item.exact);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          active
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <Icon className="text-xl" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all mt-4"
                >
                  <FaSignOutAlt className="text-xl" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ⭐ DESKTOP SIDEBAR - Solo visible en >= lg (1024px) */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden lg:block fixed left-0 top-0 h-screen bg-gradient-to-b from-amber-700 to-orange-800 text-white shadow-2xl z-50"
      >
        <div className="flex flex-col h-full p-4">
          {/* Header con Toggle */}
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FaStore className="text-2xl text-amber-200" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Admin Panel</h1>
                  <p className="text-xs text-amber-200">Sucursal</p>
                </div>
              </motion.div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          {/* Info del Usuario y Sucursal */}
          {sidebarOpen && user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                  {user.first_name?.[0] || user.username?.[0] || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {user.first_name || user.username}
                  </p>
                  <p className="text-xs text-amber-200 truncate">
                    Administrador
                  </p>
                </div>
              </div>
              
              {/* Mostrar Sucursal Asignada */}
              {user.sucursal_nombre && (
                <div className="flex items-center gap-2 text-xs text-amber-200 mt-3 pt-3 border-t border-white/20">
                  <FaStore />
                  <span className="truncate font-medium">{user.sucursal_nombre}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <Icon className={`text-xl ${!sidebarOpen && 'mx-auto'}`} />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all mt-4"
          >
            <FaSignOutAlt className={`text-xl ${!sidebarOpen && 'mx-auto'}`} />
            {sidebarOpen && <span className="font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div
        className="min-h-screen pt-14 lg:pt-0" // ⭐ Padding top para móvil
        style={{
          marginLeft: window.innerWidth >= 1024 ? (sidebarOpen ? '280px' : '80px') : '0', // ⭐ Sin margin en móvil
          transition: 'margin-left 0.3s ease',
        }}
      >
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-amber-800">
                {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Panel Administrativo'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {user?.sucursal_nombre 
                  ? `Gestionando: ${user.sucursal_nombre}`
                  : 'Gestiona tu sucursal de forma eficiente'
                }
              </p>
            </div>

            {/* Badge de Rol */}
            <div className="flex items-center gap-3">
              <div className="px-3 sm:px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                <span className="font-semibold text-sm">👤 Administrador</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8">
          {/* ⭐ Pasar la sucursal del admin automáticamente */}
          <Outlet context={{ 
            selectedBranch: user?.sucursal_id || null,
            branchName: user?.sucursal_nombre || null
          }} />
        </div>
      </div>
    </div>
  );
}