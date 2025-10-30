// Frontend/src/pages/admin/AdminReports.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartBar, FaDollarSign, FaShoppingCart, FaUsers, 
  FaCalendar, FaDownload, FaArrowUp, FaChartLine 
} from 'react-icons/fa';
import api from '../../services/api';

export default function AdminReports() {
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasSemana: 0,
    ventasMes: 0,
    pedidosTotal: 0,
    clientesActivos: 0,
    productoMasVendido: null,
    ventasPorDia: []
  });
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes'); // hoy, semana, mes

  useEffect(() => {
    fetchReports();
  }, [periodo]);

  const fetchReports = async () => {
    try {
      // Obtener estadísticas del backend
      const [pedidos, productos, usuarios] = await Promise.all([
        api.get('/pedidos/'),
        api.get('/productos/'),
        api.get('/usuarios/')
      ]);

      const pedidosData = pedidos.data.results || pedidos.data;
      const hoy = new Date();
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - 7);
      const inicioMes = new Date(hoy);
      inicioMes.setDate(1);

      // Calcular ventas por período
      const ventasHoy = pedidosData
        .filter(p => new Date(p.fecha).toDateString() === hoy.toDateString())
        .reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

      const ventasSemana = pedidosData
        .filter(p => new Date(p.fecha) >= inicioSemana)
        .reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

      const ventasMes = pedidosData
        .filter(p => new Date(p.fecha) >= inicioMes)
        .reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

      setStats({
        ventasHoy,
        ventasSemana,
        ventasMes,
        pedidosTotal: pedidosData.length,
        clientesActivos: (usuarios.data.results || usuarios.data).length,
        productoMasVendido: 'Croissant', // Placeholder
        ventasPorDia: generarVentasPorDia(pedidosData)
      });
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generarVentasPorDia = (pedidos) => {
    const dias = {};
    pedidos.forEach(p => {
      const fecha = new Date(p.fecha).toLocaleDateString('es-ES');
      dias[fecha] = (dias[fecha] || 0) + parseFloat(p.total || 0);
    });
    return Object.entries(dias).map(([fecha, total]) => ({ fecha, total }));
  };

  const reportCards = [
    {
      title: 'Ventas Hoy',
      value: `₡${stats.ventasHoy.toFixed(2)}`,
      icon: FaDollarSign,
      color: 'from-green-500 to-emerald-600',
      trend: '+12%'
    },
    {
      title: 'Ventas Semana',
      value: `₡${stats.ventasSemana.toFixed(2)}`,
      icon: FaChartLine,
      color: 'from-blue-500 to-blue-600',
      trend: '+8%'
    },
    {
      title: 'Ventas Mes',
      value: `₡${stats.ventasMes.toFixed(2)}`,
      icon: FaChartBar,
      color: 'from-purple-500 to-purple-600',
      trend: '+15%'
    },
    {
      title: 'Total Pedidos',
      value: stats.pedidosTotal,
      icon: FaShoppingCart,
      color: 'from-orange-500 to-red-600',
      trend: `${stats.pedidosTotal} pedidos`
    },
    {
      title: 'Clientes Activos',
      value: stats.clientesActivos,
      icon: FaUsers,
      color: 'from-pink-500 to-pink-600',
      trend: 'Total registrados'
    },
    {
      title: 'Producto Destacado',
      value: stats.productoMasVendido || 'N/A',
      icon: FaArrowUp,
      color: 'from-yellow-500 to-yellow-600',
      trend: 'Más vendido'
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <FaChartBar className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Reportes y Estadísticas</h1>
            <p className="text-gray-600">Análisis de ventas y rendimiento</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {['hoy', 'semana', 'mes'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                periodo === p
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg`}>
                <card.icon className="text-xl" />
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                {card.trend}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {card.value}
            </div>
            <p className="text-sm text-gray-500">{card.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ventas por Día */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaCalendar className="text-green-600" />
            Ventas por Día
          </h2>
          <div className="space-y-3">
            {stats.ventasPorDia.slice(-7).map((dia, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{dia.fecha}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (dia.total / 10000) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 w-24 text-right">
                    ₡{dia.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Resumen */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-100"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Resumen General
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Promedio por pedido</span>
              <span className="text-xl font-bold text-green-700">
                ₡{stats.pedidosTotal > 0 ? (stats.ventasMes / stats.pedidosTotal).toFixed(2) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pedidos completados</span>
              <span className="text-xl font-bold text-green-700">
                {stats.pedidosTotal}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Producto estrella</span>
              <span className="text-xl font-bold text-green-700">
                {stats.productoMasVendido}
              </span>
            </div>
          </div>
          
          <button className="w-full mt-6 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors">
            <FaDownload />
            Exportar Reporte
          </button>
        </motion.div>
      </div>
    </div>
  );
}