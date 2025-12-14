// Frontend/src/components/admin/AdminLayout.jsx
// 🔒 EXCLUSIVO PARA ADMINISTRADOR REGULAR DE SUCURSAL
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome, FaBox, FaTag, FaShoppingCart, FaChartBar,
  FaSignOutAlt, FaBars, FaTimes, FaStore, FaUser
} from 'react-icons/fa';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // ⭐ ACTUALIZADO: handleLogout igual que en DashboardLayout (sin confirmación, sin mensaje de Vercel)
  const handleLogout = () => {
    console.log('🚪 Admin: Cerrando sesión...');
    
    // Primero navega al landing
    navigate("/", { replace: true });
    
    // Luego limpia el localStorage (después de un pequeño delay para asegurar navegación)
    setTimeout(() => {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
      console.log('✅ Admin: Sesión cerrada y redirigido a landing');
    }, 100);
  };

  // 📌 Menú EXCLUSIVO para Admin Regular (SIN Usuarios, SIN Sucursales)
  const menuItems = [
    { path: '/admin', icon: FaHome, label: 'Dashboard', exact: true },
    { path: '/admin/productos', icon: FaBox, label: 'Productos' },
    { path: '/admin/ofertas', icon: FaTag, label: 'Ofertas' },
    { path: '/admin/pedidos', icon: FaShoppingCart, label: 'Pedidos' },
    { path: '/admin/reportes', icon: FaChartBar, label: 'Reportes' },
    { path: '/admin/perfil', icon: FaUser, label: 'Mi Perfil' },
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
            <span className="text-lg">🥐</span>
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
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-amber-700 to-orange-800 text-white shadow-2xl z-50"
            >
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header - FIJO */}
                <div className="flex-shrink-0 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-xl">🥐</span>
                      </div>
                      <div>
                        <h1 className="text-lg font-bold">Admin Panel</h1>
                        <p className="text-xs text-amber-200">Santa Clara</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  {/* User Info - FIJO */}
                  {user && (
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                          {user.first_name?.charAt(0) || user.username?.charAt(0) || 'A'}
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
                </div>

                {/* Navigation - CON SCROLL */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                  <nav className="space-y-2">
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
                </div>

                {/* Logout - FIJO AL FONDO */}
                <div className="flex-shrink-0 p-6 border-t border-white/20">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all"
                  >
                    <FaSignOutAlt className="text-xl" />
                    <span className="font-medium">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ⭐ DESKTOP SIDEBAR - Solo visible en >= lg (1024px) */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? '280px' : '80px' }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-gradient-to-b from-amber-700 to-orange-800 text-white shadow-2xl z-30 overflow-hidden"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header - FIJO */}
          <div className="flex-shrink-0 p-6 border-b border-white/20">
            <div className="flex items-center justify-between mb-4">
              {sidebarOpen && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-xl">🥐</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">Admin Panel</h1>
                    <p className="text-xs text-amber-200">Santa Clara</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-auto"
              >
                {sidebarOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
              </button>
            </div>

            {/* User Info - FIJO */}
            {sidebarOpen && user && (
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                    {user.first_name?.charAt(0) || user.username?.charAt(0) || 'A'}
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
          </div>

          {/* Navigation - CON SCROLL */}
          <div className="flex-1 overflow-y-auto p-6">
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
          </div>

          {/* Logout - FIJO AL FONDO */}
          <div className="flex-shrink-0 p-6 border-t border-white/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all"
            >
              <FaSignOutAlt className={`text-xl ${!sidebarOpen && 'mx-auto'}`} />
              {sidebarOpen && <span className="font-medium">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div
        className="min-h-screen pt-14 lg:pt-0"
        style={{
          marginLeft: window.innerWidth >= 1024 ? (sidebarOpen ? '280px' : '80px') : '0',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-amber-800">
                {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Panel Administrativo'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {user?.sucursal_nombre ? `Sucursal: ${user.sucursal_nombre}` : 'Gestión de sucursal'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 sm:px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                <span className="font-semibold text-sm">👑 Administrador</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}