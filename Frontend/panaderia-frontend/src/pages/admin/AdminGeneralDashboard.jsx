// Frontend/src/pages/admin/AdminGeneralDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBox, FaTag, FaShoppingCart, FaUsers, FaStore } from 'react-icons/fa';
import api from '../../services/api';
import AdminBranches from './AdminBranches';

export default function AdminGeneralDashboard() {
  const [stats, setStats] = useState({
    productos: 0,
    ofertas: 0,
    pedidos: 0,
    usuarios: 0,
    sucursales: 0,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productos, ofertas, pedidos, usuarios, sucursales] = await Promise.all([
        api.get('/productos/'),
        api.get('/ofertas/'),
        api.get('/pedidos/'),
        api.get('/usuarios/'),
        api.get('/sucursales/'),
      ]);

      setStats({
        productos: productos.data.results?.length || productos.data.length || 0,
        ofertas: ofertas.data.results?.length || ofertas.data.length || 0,
        pedidos: pedidos.data.results?.length || pedidos.data.length || 0,
        usuarios: usuarios.data.results?.length || usuarios.data.length || 0,
        sucursales: sucursales.data.results?.length || sucursales.data.length || 0,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaStore className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats.sucursales}</p>
                <p className="text-sm text-gray-600">Sucursales</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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
            transition={{ delay: 0.2 }}
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
            transition={{ delay: 0.3 }}
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
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <FaUsers className="text-pink-600 text-xl" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats.usuarios}</p>
                <p className="text-sm text-gray-600">Usuarios</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Gestión de Sucursales Integrada */}
      <AdminBranches />
    </div>
  );
}