// Frontend/src/pages/admin_general/AdminGeneralReports.jsx
// ⭐⭐⭐ CORREGIDO: Solo contar pedidos ENTREGADOS en todos los cálculos

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
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState('mes');

  const { enqueueSnackbar } = useSnackbar();

  const cargarSucursales = useCallback(async () => {
    try {
      const response = await api.get('/sucursales/activas/');
      const data = response.data.results || response.data;
      setSucursales(data);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    }
  }, []);

  const cargarEstadisticas = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true);

      const params = selectedBranch ? { sucursal: selectedBranch } : {};
      const response = await api.get('/reportes/estadisticas/', { params });

      console.log('📊 Estadísticas cargadas (del backend - solo entregados)');
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
    cargarSucursales();
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

  const exportarHTML = () => {
    if (!estadisticas) {
      enqueueSnackbar('No hay datos para exportar', { variant: 'warning' });
      return;
    }

    try {
      const totalVentas = periodo === 'dia' ? estadisticas.ventas_hoy :
        periodo === 'semana' ? estadisticas.ventas_semana :
          estadisticas.ventas_mes;

      const pedidosTotal = periodo === 'dia' ? estadisticas.pedidos_hoy :
        periodo === 'semana' ? estadisticas.pedidos_semana :
          estadisticas.pedidos_mes;

      const nombrePeriodo = periodo === 'dia' ? 'Diario' :
        periodo === 'semana' ? 'Semanal' :
          'Mensual';

      let sucursalNombre = 'Todas las Sucursales';

      if (selectedBranch && sucursales.length > 0) {
        const sucursalEncontrada = sucursales.find(s => s.id === selectedBranch);
        if (sucursalEncontrada) {
          sucursalNombre = sucursalEncontrada.nombre;
        }
      }

      const contenidoHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte ${nombrePeriodo} - Panadería Santa Clara</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              min-height: 100vh;
            }
            .container {
              max-width: 1000px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              padding: 40px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #f59e0b;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #5D4037;
              margin: 0;
              font-size: 36px;
            }
            .header p {
              color: #8D6E63;
              margin: 10px 0;
            }
            .badge {
              display: inline-block;
              background: #f59e0b;
              color: white;
              padding: 8px 20px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 14px;
              margin: 10px 0;
              box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
            }
            .important-note {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .important-note strong {
              color: #856404;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .stat-card {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              padding: 20px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
            }
            .stat-card h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .stat-card .value {
              font-size: 28px;
              font-weight: bold;
            }
            .section {
              margin-bottom: 30px;
            }
            .section h2 {
              color: #5D4037;
              border-bottom: 2px solid #f59e0b;
              padding-bottom: 10px;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f59e0b;
              color: white;
              font-weight: bold;
            }
            tr:hover {
              background-color: #fffbf0;
            }
            .chart-bar {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 10px;
              border-radius: 5px;
              margin-bottom: 8px;
            }
            .chart-bar:hover {
              background-color: #fffbf0;
            }
            .bar-container {
              flex: 1;
              background: #fed7aa;
              height: 25px;
              border-radius: 5px;
              overflow: hidden;
            }
            .bar-fill {
              height: 100%;
              background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
              display: flex;
              align-items: center;
              justify-content: flex-end;
              padding-right: 8px;
              color: white;
              font-weight: bold;
              font-size: 12px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #8D6E63;
              font-size: 12px;
            }
            .highlight-box {
              background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
              color: white;
              padding: 20px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
            }
            @media print {
              body {
                background: white;
              }
              .container {
                box-shadow: none;
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🥐 Panadería Santa Clara</h1>
              <p style="font-size: 20px; font-weight: bold; color: #5D4037;">
                Reporte ${nombrePeriodo}
              </p>
              <span class="badge">${sucursalNombre}</span>
              <p style="font-size: 12px; color: #999; margin-top: 10px;">
                Generado el ${new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
              </p>
            </div>

            <div class="important-note">
              <strong>⚠️ IMPORTANTE:</strong> Este reporte incluye únicamente pedidos con estado <strong>"Entregado"</strong>. 
              Los pedidos en otros estados (Recibido, En preparación, Listo, Cancelado) no se contabilizan como ventas.
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <h3>Ventas del Período (Entregados)</h3>
                <div class="value">₡${totalVentas.toLocaleString('es-CR', { maximumFractionDigits: 0 })}</div>
              </div>
              <div class="stat-card">
                <h3>Pedidos Entregados</h3>
                <div class="value">${pedidosTotal}</div>
              </div>
              <div class="stat-card">
                <h3>Promedio por Venta</h3>
                <div class="value">₡${(estadisticas.promedio_venta || 0).toLocaleString('es-CR', { maximumFractionDigits: 0 })}</div>
              </div>
              <div class="stat-card">
                <h3>Total Productos</h3>
                <div class="value">${estadisticas.total_productos || 0}</div>
              </div>
            </div>

            ${estadisticas.ventas_por_dia && estadisticas.ventas_por_dia.length > 0 ? `
              <div class="section">
                <h2>📊 Ventas por Día (Últimos 7 días - Solo Entregados)</h2>
                ${estadisticas.ventas_por_dia.map(dia => {
        const maxVenta = Math.max(...estadisticas.ventas_por_dia.map(d => d.total));
        const porcentaje = maxVenta > 0 ? (dia.total / maxVenta * 100) : 0;
        return `
                    <div class="chart-bar">
                      <span style="min-width: 100px; font-weight: bold; color: #5D4037;">
                        ${new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })}
                      </span>
                      <div class="bar-container">
                        <div class="bar-fill" style="width: ${porcentaje}%">
                          ${porcentaje > 20 ? `₡${dia.total.toLocaleString('es-CR')}` : ''}
                        </div>
                      </div>
                      <span style="min-width: 100px; text-align: right; font-weight: bold; color: #5D4037;">
                        ₡${dia.total.toLocaleString('es-CR')}
                      </span>
                    </div>
                  `;
      }).join('')}
              </div>
            ` : ''}

            ${estadisticas.top_productos && estadisticas.top_productos.length > 0 ? `
              <div class="section">
                <h2>🏆 Top 5 Productos Más Vendidos (Pedidos Entregados)</h2>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Producto</th>
                      <th>Unidades</th>
                      <th>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${estadisticas.top_productos.slice(0, 5).map((producto, idx) => {
        const medalla = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅';
        return `
                        <tr>
                          <td>${medalla}</td>
                          <td><strong>${producto.nombre}</strong></td>
                          <td>${producto.total_vendido} unidades</td>
                          <td style="color: #5D4037; font-weight: bold;">₡${producto.total_ingresos.toLocaleString('es-CR', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      `;
      }).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${estadisticas.producto_mas_vendido ? `
              <div class="section">
                <h2>⭐ Producto Estrella del Período</h2>
                <div class="highlight-box">
                  <h3 style="margin: 0 0 15px 0; font-size: 24px;">${estadisticas.producto_mas_vendido.nombre}</h3>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Unidades Vendidas</p>
                      <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold;">${estadisticas.producto_mas_vendido.cantidad}</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Ingresos Generados</p>
                      <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold;">₡${(estadisticas.producto_mas_vendido.ingresos || 0).toLocaleString('es-CR')}</p>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}

            <div class="section">
              <h2>📋 Resumen General (Solo Entregados)</h2>
              <table>
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Ventas</th>
                    <th>Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Hoy</strong></td>
                    <td style="color: #5D4037; font-weight: bold;">₡${(estadisticas.ventas_hoy || 0).toLocaleString('es-CR')}</td>
                    <td>${estadisticas.pedidos_hoy || 0}</td>
                  </tr>
                  <tr>
                    <td><strong>Esta Semana</strong></td>
                    <td style="color: #5D4037; font-weight: bold;">₡${(estadisticas.ventas_semana || 0).toLocaleString('es-CR')}</td>
                    <td>${estadisticas.pedidos_semana || 0}</td>
                  </tr>
                  <tr>
                    <td><strong>Este Mes</strong></td>
                    <td style="color: #5D4037; font-weight: bold;">₡${(estadisticas.ventas_mes || 0).toLocaleString('es-CR')}</td>
                    <td>${estadisticas.pedidos_mes || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="footer">
              <p><strong>Panadería Santa Clara</strong> - Sistema de Gestión</p>
              <p>Este reporte fue generado automáticamente por el sistema</p>
              <p style="margin-top: 10px; color: #f59e0b; font-weight: bold;">
                Para guardar como PDF: Archivo → Imprimir → Guardar como PDF
              </p>
              <p style="margin-top: 10px;"><em>Solo se incluyen pedidos con estado "Entregado"</em></p>
            </div>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([contenidoHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${nombrePeriodo.toLowerCase()}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const ventana = window.open('', '_blank');
      ventana.document.write(contenidoHTML);
      ventana.document.close();

      setTimeout(() => {
        ventana.print();
      }, 500);

      enqueueSnackbar('Reporte generado. Usa Ctrl+P para guardar como PDF', {
        variant: 'success',
        autoHideDuration: 5000
      });
    } catch (error) {
      console.error('Error exportando reporte:', error);
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

  const getPeriodoLabel = () => {
    switch (periodo) {
      case 'dia':
        return 'Hoy';
      case 'semana':
        return 'Esta Semana';
      case 'mes':
        return 'Este Mes';
      default:
        return '';
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
  } return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <FaChartBar className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Reportes y Estadísticas</h1>
            <p className="text-[#8D6E63]">Análisis de ventas y rendimiento (Solo entregados)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarEstadisticas}
            disabled={refreshing}
            className={`p-3 rounded-xl border-2 border-gray-300 hover:border-blue-500 transition-all ${refreshing ? 'animate-spin' : ''
              }`}
            title="Actualizar datos"
          >
            <FaSync className="text-gray-600" />
          </button>
          <button
            onClick={exportarHTML}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <FaDownload />
            Exportar Reporte
          </button>
        </div>
      </div>

      {/* Nota importante */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-amber-600 text-xl">⚠️</div>
          <div>
            <p className="text-amber-800 font-semibold">
              Solo pedidos entregados
            </p>
            <p className="text-amber-700 text-sm mt-1">
              Los reportes muestran únicamente pedidos con estado "Entregado".
              Los pedidos en otros estados no se contabilizan como ventas.
            </p>
          </div>
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${periodo === p
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
          key={`ventas-${periodo}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <FaMoneyBillWave className="text-3xl opacity-80" />
            <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              {getPeriodoLabel()}
            </span>
          </div>
          <p className="text-sm opacity-90 mb-1">Ventas (Entregados)</p>
          <p className="text-3xl font-bold">
            ₡{getVentasPorPeriodo().toLocaleString('es-CR')}
          </p>
        </motion.div>

        <motion.div
          key={`pedidos-${periodo}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <FaShoppingCart className="text-3xl opacity-80" />
            <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              {getPeriodoLabel()}
            </span>
          </div>
          <p className="text-sm opacity-90 mb-1">Pedidos Entregados</p>
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

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ventas por Día */}
        {estadisticas.ventas_por_dia && estadisticas.ventas_por_dia.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-[#5D4037] mb-4 flex items-center gap-2">
              <FaChartBar className="text-blue-600" />
              Ventas por Día (Últimos 7 días - Entregados)
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
              Top 5 Productos Más Vendidos (Entregados)
            </h3>
            <div className="space-y-3">
              {estadisticas.top_productos.slice(0, 5).map((producto, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-amber-500' :
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
      </div>

      {/* Producto Más Vendido del Período */}
      {estadisticas.producto_mas_vendido && (
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <FaTrophy className="text-4xl" />
            <div>
              <p className="text-sm opacity-90">Producto Estrella de {getPeriodoLabel()}</p>
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
        <h3 className="text-xl font-bold text-[#5D4037] mb-4">Resumen General (Solo Entregados)</h3>
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
          <li>Puedes exportar reportes y guardarlos como PDF usando Ctrl+P</li>
          <li><strong>Los reportes muestran solo pedidos entregados</strong></li>
          {selectedBranch && <li className="font-semibold">Filtrando por sucursal seleccionada</li>}
        </ul>
      </div>
    </div>
  );
}