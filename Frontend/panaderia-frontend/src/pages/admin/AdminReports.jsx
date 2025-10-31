// Frontend/src/pages/admin/AdminReports.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartBar, FaDollarSign, FaShoppingCart, FaUsers, 
  FaCalendar, FaDownload, FaArrowUp, FaChartLine 
} from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

export default function AdminReports() {
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasSemana: 0,
    ventasMes: 0,
    pedidosTotal: 0,
    pedidosPeriodo: 0,
    clientesActivos: 0,
    productoMasVendido: null,
    ventasPorDia: [],
    promedioVenta: 0
  });
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes'); // hoy, semana, mes
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchReports();
  }, [periodo]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [pedidos, productos, usuarios] = await Promise.all([
        api.get('/pedidos/'),
        api.get('/productos/'),
        api.get('/usuarios/')
      ]);

      const pedidosData = pedidos.data.results || pedidos.data;
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - 7);
      
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      // Calcular ventas por período
      const ventasHoy = pedidosData
        .filter(p => {
          const fechaPedido = new Date(p.fecha);
          fechaPedido.setHours(0, 0, 0, 0);
          return fechaPedido.getTime() === hoy.getTime();
        })
        .reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

      const ventasSemana = pedidosData
        .filter(p => new Date(p.fecha) >= inicioSemana)
        .reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

      const ventasMes = pedidosData
        .filter(p => new Date(p.fecha) >= inicioMes)
        .reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

      // Pedidos del período actual
      let pedidosPeriodo = 0;
      if (periodo === 'hoy') {
        pedidosPeriodo = pedidosData.filter(p => {
          const fechaPedido = new Date(p.fecha);
          fechaPedido.setHours(0, 0, 0, 0);
          return fechaPedido.getTime() === hoy.getTime();
        }).length;
      } else if (periodo === 'semana') {
        pedidosPeriodo = pedidosData.filter(p => new Date(p.fecha) >= inicioSemana).length;
      } else {
        pedidosPeriodo = pedidosData.filter(p => new Date(p.fecha) >= inicioMes).length;
      }

      // Producto más vendido
      const productoContador = {};
      pedidosData.forEach(pedido => {
        if (pedido.detalles && Array.isArray(pedido.detalles)) {
          pedido.detalles.forEach(detalle => {
            const nombre = detalle.producto?.nombre || detalle.producto_nombre;
            if (nombre) {
              productoContador[nombre] = (productoContador[nombre] || 0) + detalle.cantidad;
            }
          });
        }
      });
      
      const productoMasVendido = Object.keys(productoContador).length > 0
        ? Object.entries(productoContador).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

      // Promedio por venta
      const totalVentas = periodo === 'hoy' ? ventasHoy : periodo === 'semana' ? ventasSemana : ventasMes;
      const promedioVenta = pedidosPeriodo > 0 ? totalVentas / pedidosPeriodo : 0;

      setStats({
        ventasHoy,
        ventasSemana,
        ventasMes,
        pedidosTotal: pedidosData.length,
        pedidosPeriodo,
        clientesActivos: (usuarios.data.results || usuarios.data).length,
        productoMasVendido,
        ventasPorDia: generarVentasPorDia(pedidosData, periodo),
        promedioVenta
      });
    } catch (error) {
      console.error('Error cargando reportes:', error);
      enqueueSnackbar('Error al cargar reportes', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const generarVentasPorDia = (pedidos, periodo) => {
    const hoy = new Date();
    const dias = {};
    
    // Definir el rango según el período
    let fechaInicio;
    if (periodo === 'hoy') {
      fechaInicio = new Date(hoy);
      fechaInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'semana') {
      fechaInicio = new Date(hoy);
      fechaInicio.setDate(hoy.getDate() - 7);
    } else {
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    }

    // Filtrar pedidos del período
    const pedidosFiltrados = pedidos.filter(p => new Date(p.fecha) >= fechaInicio);

    pedidosFiltrados.forEach(p => {
      const fecha = new Date(p.fecha).toLocaleDateString('es-ES');
      dias[fecha] = (dias[fecha] || 0) + parseFloat(p.total || 0);
    });

    return Object.entries(dias)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => new Date(a.fecha.split('/').reverse().join('-')) - new Date(b.fecha.split('/').reverse().join('-')));
  };

  const exportarPDF = () => {
    try {
      // Datos del reporte según el período
      const totalVentas = periodo === 'hoy' ? stats.ventasHoy : periodo === 'semana' ? stats.ventasSemana : stats.ventasMes;
      const nombrePeriodo = periodo === 'hoy' ? 'Diario' : periodo === 'semana' ? 'Semanal' : 'Mensual';
      
      // Crear contenido HTML para el PDF
      const contenidoHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte ${nombrePeriodo} - Panadería</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
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
            }
            .header p {
              color: #8D6E63;
              margin: 5px 0;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .stat-card {
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 15px;
              background: #fffbf0;
            }
            .stat-card h3 {
              margin: 0 0 10px 0;
              color: #5D4037;
              font-size: 14px;
            }
            .stat-card .value {
              font-size: 24px;
              font-weight: bold;
              color: #f59e0b;
            }
            .table-container {
              margin-top: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
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
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #8D6E63;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🥐 Panadería Artesanal</h1>
            <p>Reporte ${nombrePeriodo}</p>
            <p>Generado el ${new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <h3>Total Ventas (${nombrePeriodo})</h3>
              <div class="value">₡${totalVentas.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <h3>Total Pedidos</h3>
              <div class="value">${stats.pedidosPeriodo}</div>
            </div>
            <div class="stat-card">
              <h3>Promedio por Venta</h3>
              <div class="value">₡${stats.promedioVenta.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <h3>Producto Más Vendido</h3>
              <div class="value" style="font-size: 18px;">${stats.productoMasVendido}</div>
            </div>
          </div>

          <div class="table-container">
            <h2 style="color: #5D4037;">Ventas por Día</h2>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Total Ventas</th>
                </tr>
              </thead>
              <tbody>
                ${stats.ventasPorDia.map(dia => `
                  <tr>
                    <td>${dia.fecha}</td>
                    <td>₡${dia.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Este reporte fue generado automáticamente por el sistema de Panadería Artesanal</p>
            <p>Para más información, contacte al administrador del sistema</p>
          </div>
        </body>
        </html>
      `;

      // Crear un blob y descargarlo
      const blob = new Blob([contenidoHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${periodo}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Abrir en nueva ventana para imprimir como PDF
      const ventana = window.open('', '_blank');
      ventana.document.write(contenidoHTML);
      ventana.document.close();
      
      // Esperar un poco y abrir el diálogo de impresión
      setTimeout(() => {
        ventana.print();
      }, 500);

      enqueueSnackbar('Reporte generado exitosamente. Usa Ctrl+P para guardar como PDF', { 
        variant: 'success',
        autoHideDuration: 5000 
      });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      enqueueSnackbar('Error al exportar reporte', { variant: 'error' });
    }
  };

  const reportCards = [
    {
      title: 'Ventas Hoy',
      value: `₡${stats.ventasHoy.toFixed(2)}`,
      icon: FaDollarSign,
      color: 'from-green-500 to-emerald-600',
      trend: '+12%',
      active: periodo === 'hoy'
    },
    {
      title: 'Ventas Semana',
      value: `₡${stats.ventasSemana.toFixed(2)}`,
      icon: FaChartLine,
      color: 'from-blue-500 to-blue-600',
      trend: '+8%',
      active: periodo === 'semana'
    },
    {
      title: 'Ventas Mes',
      value: `₡${stats.ventasMes.toFixed(2)}`,
      icon: FaChartBar,
      color: 'from-purple-500 to-purple-600',
      trend: '+15%',
      active: periodo === 'mes'
    },
    {
      title: 'Total Pedidos',
      value: stats.pedidosPeriodo,
      icon: FaShoppingCart,
      color: 'from-orange-500 to-red-600',
      trend: `${stats.pedidosPeriodo} pedidos`
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <FaChartBar className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Reportes y Estadísticas</h1>
            <p className="text-gray-600">
              Análisis {periodo === 'hoy' ? 'diario' : periodo === 'semana' ? 'semanal' : 'mensual'}
            </p>
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
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes'}
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
            className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all ${
              card.active ? 'border-green-400 shadow-green-200' : 'border-gray-100'
            } hover:shadow-xl`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg`}>
                <card.icon className="text-xl" />
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                {card.trend}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1 truncate">
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
            Ventas por Día ({periodo === 'hoy' ? 'Hoy' : periodo === 'semana' ? 'Últimos 7 días' : 'Este mes'})
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats.ventasPorDia.length > 0 ? (
              stats.ventasPorDia.map((dia, idx) => (
                <div key={idx} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <span className="text-sm text-gray-600 font-medium">{dia.fecha}</span>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(100, (dia.total / Math.max(...stats.ventasPorDia.map(d => d.total))) * 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 w-28 text-right">
                      ₡{dia.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No hay ventas en este período</p>
            )}
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
            <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
              <span className="text-gray-600 font-medium">Promedio por pedido</span>
              <span className="text-2xl font-bold text-green-700">
                ₡{stats.promedioVenta.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
              <span className="text-gray-600 font-medium">Pedidos completados</span>
              <span className="text-2xl font-bold text-green-700">
                {stats.pedidosPeriodo}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
              <span className="text-gray-600 font-medium">Producto estrella</span>
              <span className="text-xl font-bold text-green-700 truncate max-w-[150px]">
                {stats.productoMasVendido}
              </span>
            </div>
          </div>
          
          <button 
            onClick={exportarPDF}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all hover:shadow-lg"
          >
            <FaDownload />
            Exportar Reporte {periodo === 'hoy' ? 'Diario' : periodo === 'semana' ? 'Semanal' : 'Mensual'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}