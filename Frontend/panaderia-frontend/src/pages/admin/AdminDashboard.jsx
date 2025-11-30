// Frontend/panaderia-frontend/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBox, FaTag, FaShoppingCart, FaStore } from 'react-icons/fa';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    productos: 0,
    ofertas: 0,
    pedidos: 0,
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

    // ✅ Redirigir Admin General a su panel
    if (userData?.rol === 'administrador_general') {
      console.log('🔀 Redirigiendo Admin General a /admin-general');
      navigate('/admin-general', { replace: true });
      return;
    }

    // Cargar estadísticas solo si es Admin Regular
    fetchStats(userData);
  }, [navigate]);

  const fetchStats = async (userData) => {
    try {
      const params = {};
      
      // ⭐ Admin Regular: SIEMPRE filtrar por su sucursal
      if (userData?.sucursal_id) {
        params.sucursal = userData.sucursal_id;
        console.log('🔍 Filtrando por sucursal:', userData.sucursal_id);
      }

      const [productos, ofertas, pedidos] = await Promise.all([
        api.get('/productos/', { params }),
        api.get('/ofertas/', { params }),
        api.get('/pedidos/', { params }),
      ]);

      setStats({
        productos: productos.data.results?.length || productos.data.length || 0,
        ofertas: ofertas.data.results?.length || ofertas.data.length || 0,
        pedidos: pedidos.data.results?.length || pedidos.data.length || 0,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
      {user?.sucursal_nombre && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>
      )}
    </div>
  );
}