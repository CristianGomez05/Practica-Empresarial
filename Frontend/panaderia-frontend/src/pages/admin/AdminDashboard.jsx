// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaBox, FaTag, FaClipboardList, FaUsers, 
  FaChartLine, FaDollarSign, FaClock, FaCheckCircle 
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    productos: 0,
    ofertas: 0,
    pedidos: 0,
    usuarios: 0,
    ventasTotal: 0,
    pedidosHoy: 0,
    pedidosPendientes: 0,
    pedidosCompletados: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productos, ofertas, pedidos, usuarios] = await Promise.all([
        api.get('/productos/'),
        api.get('/ofertas/'),
        api.get('/pedidos/'),
        api.get('/usuarios/')
      ]);

      const pedidosData = pedidos.data.results || pedidos.data;
      const hoy = new Date().toISOString().split('T')[0];
      
      setStats({
        productos: (productos.data.results || productos.data).length,
        ofertas: (ofertas.data.results || ofertas.data).length,
        pedidos: pedidosData.length,
        usuarios: (usuarios.data.results || usuarios.data).length,
        ventasTotal: pedidosData.reduce((sum, p) => sum + parseFloat(p.total || 0), 0),
        pedidosHoy: pedidosData.filter(p => p.fecha.split('T')[0] === hoy).length,
        pedidosPendientes: pedidosData.filter(p => p.estado === 'recibido' || p.estado === 'en_preparacion').length,
        pedidosCompletados: pedidosData.filter(p => p.estado === 'entregado').length
      });

      setRecentOrders(pedidosData.slice(0, 5));
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Ventas',
      value: `₡${stats.ventasTotal.toFixed(2)}`,
      icon: FaDollarSign,
      color: 'from-green-500 to-emerald-600',
      change: '+12.5%'
    },
    {
      title: 'Pedidos Hoy',
      value: stats.pedidosHoy,
      icon: FaClock,
      color: 'from-blue-500 to-blue-600',
      change: `${stats.pedidosHoy} nuevos`
    },
    {
      title: 'Productos',
      value: stats.productos,
      icon: FaBox,
      color: 'from-purple-500 to-purple-600',
      link: '/admin/productos'
    },
    {
      title: 'Ofertas Activas',
      value: stats.ofertas,
      icon: FaTag,
      color: 'from-orange-500 to-red-600',
      link: '/admin/ofertas'
    },
    {
      title: 'Total Pedidos',
      value: stats.pedidos,
      icon: FaClipboardList,
      color: 'from-indigo-500 to-indigo-600',
      link: '/admin/pedidos'
    },
    {
      title: 'Usuarios',
      value: stats.usuarios,
      icon: FaUsers,
      color: 'from-pink-500 to-pink-600',
    },
    {
      title: 'Pedidos Pendientes',
      value: stats.pedidosPendientes,
      icon: FaClock,
      color: 'from-yellow-500 to-yellow-600',
      badge: 'Urgente'
    },
    {
      title: 'Completados',
      value: stats.pedidosCompletados,
      icon: FaCheckCircle,
      color: 'from-green-500 to-green-600',
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Panel de Administración 🥐
            </h1>
            <p className="text-gray-300">
              Bienvenido al sistema de gestión de Panadería Artesanal
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-amber-400">
              {new Date().toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'long' 
              })}
            </div>
            <div className="text-gray-400">
              {new Date().toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {card.link ? (
              <Link
                to={card.link}
                className="block bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group"
              >
                <StatCard card={card} />
              </Link>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <StatCard card={card} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Pedidos Recientes</h2>
          <Link
            to="/admin/pedidos"
            className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-2"
          >
            Ver Todos <FaChartLine />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay pedidos recientes</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                    #{order.id}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {order.usuario?.username || 'Cliente'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.fecha).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-700 text-lg">
                    ₡{order.total}
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    {order.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Componente auxiliar para las tarjetas de estadísticas
function StatCard({ card }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
          <card.icon className="text-xl" />
        </div>
        {card.badge && (
          <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full font-semibold">
            {card.badge}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-1">
        {card.value}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{card.title}</p>
        {card.change && (
          <span className="text-xs text-green-600 font-semibold">
            {card.change}
          </span>
        )}
      </div>
    </>
  );
}