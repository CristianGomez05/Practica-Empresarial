// Frontend/src/pages/admin/AdminDashboard.jsx - COMPLETO Y CORREGIDO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBox, FaTag, FaShoppingCart, FaUsers, FaStore } from 'react-icons/fa';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    productos: 0,
    ofertas: 0,
    pedidos: 0,
    usuarios: 0,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);

    console.log('👤 Usuario actual:', userData);
    console.log('🏪 Sucursal asignada:', userData?.sucursal_nombre);
    console.log('🔑 Sucursal ID:', userData?.sucursal_id);

    // ✅ Redirigir Admin General
    if (userData?.rol === 'administrador_general') {
      console.log('🔀 Redirigiendo Admin General a /admin/sucursales');
      navigate('/admin/sucursales', { replace: true });
      return;
    }

    // Cargar estadísticas solo si NO es Admin General
    fetchStats(userData);
  }, [navigate]);

  const fetchStats = async (userData) => {
    try {
      const params = {};
      if (userData?.rol === 'administrador' && userData?.sucursal_id) {
        params.sucursal = userData.sucursal_id;
        console.log('🔍 Filtrando por sucursal:', userData.sucursal_id);
      }

      const [productos, ofertas, pedidos, usuarios] = await Promise.all([
        api.get('/productos/', { params }),
        api.get('/ofertas/', { params }),
        api.get('/pedidos/'),
        api.get('/usuarios/'),
      ]);

      setStats({
        productos: productos.data.results?.length || productos.data.length || 0,
        ofertas: ofertas.data.results?.length || ofertas.data.length || 0,
        pedidos: pedidos.data.results?.length || pedidos.data.length || 0,
        usuarios: usuarios.data.results?.length || usuarios.data.length || 0,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // No mostrar nada mientras redirige
  if (user?.rol === 'administrador_general') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bienvenida con Sucursal */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <FaStore className="text-3xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Bienvenido, {user?.first_name || user?.username}!
            </h1>
            {user?.sucursal_nombre ? (
              <div className="flex items-center gap-2">
                <span className="text-amber-100 text-lg">Administrando:</span>
                <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-xl font-bold border-2 border-white/30">
                  📍 {user.sucursal_nombre}
                </span>
              </div>
            ) : (
              <p className="text-amber-100 bg-red-500/30 px-4 py-2 rounded-lg inline-block">
                ⚠️ Sin sucursal asignada - Contacta al administrador general
              </p>
            )}
          </div>
        </div>
        <p className="text-amber-50 text-sm">
          Panel de administración de tu sucursal
        </p>
      </div>

      {/* Alerta si no tiene sucursal */}
      {!user?.sucursal_nombre && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center">
          <p className="text-red-800 font-semibold text-lg mb-2">
            ⚠️ No tienes una sucursal asignada
          </p>
          <p className="text-red-600">
            Por favor, contacta al administrador general para que te asigne una sucursal.
          </p>
        </div>
      )}

      {/* Estadísticas */}
      {!loading && user?.sucursal_nombre && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaBox className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats.productos}</p>
                <p className="text-sm text-gray-600">Productos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaTag className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats.ofertas}</p>
                <p className="text-sm text-gray-600">Ofertas</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaShoppingCart className="text-orange-600 text-xl" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats.pedidos}</p>
                <p className="text-sm text-gray-600">Pedidos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaUsers className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats.usuarios}</p>
                <p className="text-sm text-gray-600">Usuarios</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Info Cards */}
      {user?.sucursal_nombre && (
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-100"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaStore className="text-amber-600" />
              Tu Sucursal
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-semibold text-gray-800">{user.sucursal_nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ID:</span>
                <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">{user.sucursal_id}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  Solo puedes gestionar productos, ofertas y pedidos de esta sucursal
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border-2 border-blue-200"
          >
            <h3 className="text-lg font-bold text-blue-900 mb-4">
              Acceso Rápido
            </h3>
            <div className="space-y-2">
              <a
                href="/admin/productos"
                className="block p-3 bg-white hover:bg-blue-50 rounded-lg transition-colors text-gray-700 hover:text-blue-600 font-medium"
              >
                📦 Gestionar Productos
              </a>
              <a
                href="/admin/ofertas"
                className="block p-3 bg-white hover:bg-blue-50 rounded-lg transition-colors text-gray-700 hover:text-blue-600 font-medium"
              >
                🏷️ Gestionar Ofertas
              </a>
              <a
                href="/admin/pedidos"
                className="block p-3 bg-white hover:bg-blue-50 rounded-lg transition-colors text-gray-700 hover:text-blue-600 font-medium"
              >
                🛒 Ver Pedidos
              </a>
              <a
                href="/admin/reportes"
                className="block p-3 bg-white hover:bg-blue-50 rounded-lg transition-colors text-gray-700 hover:text-blue-600 font-medium"
              >
                📊 Ver Reportes
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}