// Frontend/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBox, FaTag, FaShoppingCart, FaUsers, FaStore } from 'react-icons/fa';
import api from '../../services/api';
import AdminBranches from './AdminBranches';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    productos: 0,
    ofertas: 0,
    pedidos: 0,
    usuarios: 0,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Obtener usuario actual
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);

    // Cargar estadísticas
    const fetchStats = async () => {
      try {
        const [productos, ofertas, pedidos, usuarios] = await Promise.all([
          api.get('/productos/'),
          api.get('/ofertas/'),
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

    fetchStats();
  }, []);

  // ⭐ Si es Admin General, mostrar gestión de sucursales
  if (user?.rol === 'administrador_general') {
    return (
      <div className="space-y-6">
        {/* Bienvenida */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            ¡Bienvenido, {user?.first_name || user?.username}!
          </h1>
          <p className="text-purple-100">
            Panel de Administrador General - Gestiona todas las sucursales
          </p>
        </div>

        {/* Estadísticas Rápidas */}
        {!loading && (
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

        {/* ⭐ Gestión de Sucursales */}
        <AdminBranches />
      </div>
    );
  }

  // ⭐ Admin Regular - Dashboard normal
  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ¡Bienvenido, {user?.first_name || user?.username}!
        </h1>
        <p className="text-amber-100">
          {user?.sucursal_nombre ? `Sucursal: ${user.sucursal_nombre}` : 'Panel de Administrador'}
        </p>
      </div>

      {/* Estadísticas */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Mismas cards de estadísticas */}
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
    </div>
  );
}