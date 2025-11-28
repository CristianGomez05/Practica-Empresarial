// Frontend/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchStats(userData);
  }, []);

  const fetchStats = async (userData) => {
    try {
      // ⭐ Admin Regular: Filtrar por su sucursal
      const params = {};
      if (userData?.rol === 'administrador' && userData?.sucursal_id) {
        params.sucursal = userData.sucursal_id;
      }

      const [productos, ofertas, pedidos, usuarios] = await Promise.all([
        api.get('/productos/', { params }),
        api.get('/ofertas/', { params }),
        api.get('/pedidos/'),  // Los pedidos ya se filtran en el backend
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

  return (
    <div className="space-y-6">
      {/* Bienvenida con Sucursal */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ¡Bienvenido, {user?.first_name || user?.username}!
        </h1>
        <div className="flex items-center gap-3">
          <FaStore className="text-2xl text-amber-200" />
          <p className="text-amber-100 text-lg">
            <span className="font-semibold">Sucursal:</span> {user?.sucursal_nombre || 'Sin asignar'}
          </p>
        </div>
        <p className="text-amber-100 text-sm mt-2">
          Gestiona los productos, ofertas y pedidos de tu sucursal
        </p>
      </div>

      {/* Estadísticas */}
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

      {/* Info Box para Admin Regular */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
          <FaStore className="text-blue-600" />
          Gestión de Sucursal
        </h3>
        <div className="text-blue-800 space-y-2">
          <p>
            ✅ Puedes gestionar <strong>productos</strong> y <strong>ofertas</strong> de tu sucursal
          </p>
          <p>
            ✅ Puedes ver y gestionar <strong>pedidos</strong> con productos de tu sucursal
          </p>
          <p>
            ✅ Puedes crear nuevos <strong>usuarios</strong> clientes
          </p>
          <p className="text-sm mt-3 pt-3 border-t border-blue-200">
            ℹ️ Solo el <strong>Administrador General</strong> puede modificar usuarios, gestionar sucursales y ver datos de todas las sucursales
          </p>
        </div>
      </div>
    </div>
  );
}