// Frontend/src/pages/admin_general/AdminGeneralReports.jsx
// COMPLETO Y FUNCIONAL - Sistema de reportes con gráficas

import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaChartBar, FaCalendar, FaMoneyBillWave, FaShoppingCart, FaBox, FaDownload, FaSync, FaTrophy } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import useSmartRefresh from '../../hooks/useAutoRefresh';

export default function AdminGeneralReports() {
  const { selectedBranch } = useOutletContext();
  
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState('mes'); // 'dia', 'semana', 'mes'

  const { enqueueSnackbar } = useSnackbar();

  const cargarEstadisticas = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true);
      
      const params = selectedBranch ? { sucursal: selectedBranch } : {};
      const response = await api.get('/reportes/estadisticas/', { params });
      
      console.log('📊 Estadísticas cargadas');
      setEstadisticas(response.data);
      
      if (refreshing) {
        enqueueSnackbar('Datos actualizados', { variant: 'info', autoHideDuration: 2000 });
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      if (!loading) {
        enqueueSnackbar('Error al cargar estadísticas', { variant: 'error' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, refreshing, selectedBranch, enqueueSnackbar]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  useEffect(() => {
    if (!loading) {
      cargarEstadisticas();
    }
  }, [selectedBranch]);

  useSmartRefresh(cargarEstadisticas, {
    interval: 60000,
    enabled: true,
    refreshOnFocus: true
  });

  const exportarPDF = async () => {
    try {
      const params = selectedBranch ? { sucursal: selectedBranch, formato: 'pdf' } : { formato: 'pdf' };
      const response = await api.get('/reportes/exportar/', { 
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      enqueueSnackbar('Reporte exportado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('❌ Error exportando PDF:', error);
      enqueueSnackbar('Error al exportar reporte', { variant: 'error' });
    }
  };

  const exportarHTML = async () => {
    try {
      const params = selectedBranch ? { sucursal: selectedBranch, formato: 'html' } : { formato: 'html' };
      const response = await api.get('/reportes/exportar/', { params });
      
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${new Date().toISOString().split('T')[0]}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      enqueueSnackbar('Reporte HTML exportado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('❌ Error exportando HTML:', error);
      enqueueSnackbar('Error al exportar reporte', { variant: 'error' });
    }
  };

  const getVentasPorPeriodo = () => {
    if (!estadisticas) return 0;
    switch (periodo) {
      case 'dia':
        return estadisticas.ventas_hoy || 0;
      case 'semana':
        return estadisticas.ventas_semana || 0;
      case 'mes':
        return estadisticas.ventas_mes || 0;
      default:
        return 0;
    }
  };

  const getPedidosPorPeriodo = () => {
    if (!estadisticas) return 0;
    switch (periodo) {
      case 'dia':
        return estadisticas.pedidos_hoy || 0;
      case 'semana':
        return estadisticas.pedidos_semana || 0;
      case 'mes':
        return estadisticas.pedidos_mes || 0;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <FaChartBar className="text-6xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <FaChartBar className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Reportes y Estadísticas</h1>
            <p className="text-[#8D6E63]">Análisis de ventas y rendimiento</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarEstadisticas}
            disabled={refreshing}
            className={`p-3 rounded-xl border-2 border-gray-300 hover:border-blue-500 transition-all ${
              refreshing ? 'animate-spin' : ''
            }`}
            title="Actualizar datos"
          >
            <FaSync className="text-gray-600" />
          </button>
          <button
            onClick={exportarPDF}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors"
          >
            <FaDownload />
            PDF
          </button>
          <button
            onClick={exportarHTML}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors"
          >
            <FaDownload />
            HTML
          </button>
        </div>
      </div>

      {/* Selector de Período */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center gap-3">
          <FaCalendar className="text-blue-600" />
          <span className="font-semibold text-[#5D4037]">Período:</span>
          <div className="flex gap-2">
            {['dia', 'semana', 'mes'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  periodo === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'dia' ? 'Hoy' : p === 'semana' ? 'Esta Semana' : 'Este Mes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <FaMoneyBillWave className="text-3xl opacity-80" />
            <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              {periodo === 'dia' ? 'Hoy' : periodo === 'semana' ? 'Semana' : 'Mes'}
            </span>
          </div>
          <p className="text-sm opacity-90 mb-1">Ventas</p>
          <p className="text-3xl font-bold">
            ₡{getVentasPorPeriodo().toLocaleString('es-CR')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <FaShoppingCart className="text-3xl opacity-80" />
            <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              {periodo === 'dia' ? 'Hoy' : periodo === 'semana' ? 'Semana' : 'Mes'}
            </span>
          </div>
          <p className="text-sm opacity-90 mb-1">Pedidos</p>
          <p className="text-3xl font-bold">{getPedidosPorPeriodo()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <FaBox className="text-3xl opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Productos</p>
          <p className="text-3xl font-bold">{estadisticas.total_productos || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <FaMoneyBillWave className="text-3xl opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Promedio por Venta</p>
          <p className="text-3xl font-bold">
            ₡{(estadisticas.promedio_venta || 0).toLocaleString('es-CR', { maximumFractionDigits: 0 })}
          </p>
        </motion.div>
      </div>

      {/* Ventas por Día (Gráfica Simple) */}
      {estadisticas.ventas_por_dia && estadisticas.ventas_por_dia.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-[#5D4037] mb-4 flex items-center gap-2">
            <FaChartBar className="text-blue-600" />
            Ventas por Día (Últimos 7 días)
          </h3>
          <div className="space-y-3">
            {estadisticas.ventas_por_dia.map((dia, index) => {
              const maxVenta = Math.max(...estadisticas.ventas_por_dia.map(d => d.total));
              const porcentaje = maxVenta > 0 ? (dia.total / maxVenta) * 100 : 0;
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-ES', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </span>
                    <span className="font-bold text-[#5D4037]">
                      ₡{dia.total.toLocaleString('es-CR')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${porcentaje}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top 5 Productos */}
      {estadisticas.top_productos && estadisticas.top_productos.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-[#5D4037] mb-4 flex items-center gap-2">
            <FaTrophy className="text-amber-500" />
            Top 5 Productos Más Vendidos
          </h3>
          <div className="space-y-3">
            {estadisticas.top_productos.slice(0, 5).map((producto, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-amber-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-600' :
                  'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#5D4037]">{producto.nombre}</p>
                  <p className="text-sm text-gray-600">
                    {producto.total_vendido} unidades vendidas
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#5D4037]">
                    ₡{producto.total_ingresos.toLocaleString('es-CR')}
                  </p>
                  <p className="text-xs text-gray-600">en ventas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Producto Más Vendido del Período */}
      {estadisticas.producto_mas_vendido && (
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <FaTrophy className="text-4xl" />
            <div>
              <p className="text-sm opacity-90">Producto Estrella del {periodo === 'dia' ? 'Día' : periodo === 'semana' ? 'Semana' : 'Mes'}</p>
              <p className="text-2xl font-bold">{estadisticas.producto_mas_vendido.nombre}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-sm opacity-90">Unidades Vendidas</p>
              <p className="text-3xl font-bold">{estadisticas.producto_mas_vendido.cantidad}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-sm opacity-90">Ingresos Generados</p>
              <p className="text-3xl font-bold">
                ₡{(estadisticas.producto_mas_vendido.ingresos || 0).toLocaleString('es-CR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resumen General */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-[#5D4037] mb-4">Resumen General</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Ventas Hoy</span>
              <span className="font-bold text-[#5D4037]">
                ₡{(estadisticas.ventas_hoy || 0).toLocaleString('es-CR')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Ventas Esta Semana</span>
              <span className="font-bold text-[#5D4037]">
                ₡{(estadisticas.ventas_semana || 0).toLocaleString('es-CR')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Ventas Este Mes</span>
              <span className="font-bold text-[#5D4037]">
                ₡{(estadisticas.ventas_mes || 0).toLocaleString('es-CR')}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Pedidos Hoy</span>
              <span className="font-bold text-[#5D4037]">{estadisticas.pedidos_hoy || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Pedidos Esta Semana</span>
              <span className="font-bold text-[#5D4037]">{estadisticas.pedidos_semana || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Pedidos Este Mes</span>
              <span className="font-bold text-[#5D4037]">{estadisticas.pedidos_mes || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">📊 Nota sobre los reportes</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Los datos se actualizan automáticamente cada minuto</li>
          <li>Puedes exportar reportes en formato PDF o HTML</li>
          <li>Los reportes muestran solo pedidos completados</li>
          {selectedBranch && <li className="font-semibold">Filtrando por sucursal seleccionada</li>}
        </ul>
      </div>
    </div>
  );
}