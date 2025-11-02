// Frontend/src/pages/admin/AdminReports.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartBar, FaDollarSign, FaShoppingCart, FaUsers, 
  FaCalendar, FaDownload, FaArrowUp, FaChartLine, FaChartPie 
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
    promedioVenta: 0,
    productosPorVentas: [] 
  });
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');
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
      
      // ⭐ FIX: Obtener fecha actual en zona horaria local
      const hoy = new Date();
      const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      
      const inicioSemana = new Date(hoySoloFecha);
      inicioSemana.setDate(hoySoloFecha.getDate() - 6); // Últimos 7 días incluyendo hoy
      
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      console.log('📅 Filtros de fecha:');
      console.log('   Hoy:', hoySoloFecha.toLocaleDateString());
      console.log('   Inicio Semana:', inicioSemana.toLocaleDateString());
      console.log('   Inicio Mes:', inicioMes.toLocaleDateString());

      // ⭐ FIX: Función para comparar fechas ignorando la hora
      const esMismaFecha = (fecha1, fecha2) => {
        const f1 = new Date(fecha1);
        const f2 = new Date(fecha2);
        return f1.getFullYear() === f2.getFullYear() &&
               f1.getMonth() === f2.getMonth() &&
               f1.getDate() === f2.getDate();
      };

      // ⭐ CORREGIDO: Calcular ventas por período
      const pedidosHoy = pedidosData.filter(p => {
        const fechaPedido = new Date(p.fecha);
        return esMismaFecha(fechaPedido, hoySoloFecha);
      });

      const pedidosSemana = pedidosData.filter(p => {
        const fechaPedido = new Date(p.fecha);
        return fechaPedido >= inicioSemana && fechaPedido <= hoy;
      });

      const pedidosMes = pedidosData.filter(p => {
        const fechaPedido = new Date(p.fecha);
        return fechaPedido >= inicioMes && fechaPedido <= hoy;
      });

      const ventasHoy = pedidosHoy.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
      const ventasSemana = pedidosSemana.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
      const ventasMes = pedidosMes.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

      console.log('💰 Ventas calculadas:');
      console.log('   Hoy:', ventasHoy, `(${pedidosHoy.length} pedidos)`);
      console.log('   Semana:', ventasSemana, `(${pedidosSemana.length} pedidos)`);
      console.log('   Mes:', ventasMes, `(${pedidosMes.length} pedidos)`);

      // Pedidos del período actual
      let pedidosPeriodo = 0;
      let pedidosFiltrados = [];
      
      if (periodo === 'hoy') {
        pedidosFiltrados = pedidosHoy;
        pedidosPeriodo = pedidosHoy.length;
      } else if (periodo === 'semana') {
        pedidosFiltrados = pedidosSemana;
        pedidosPeriodo = pedidosSemana.length;
      } else {
        pedidosFiltrados = pedidosMes;
        pedidosPeriodo = pedidosMes.length;
      }

      // ⭐ NUEVO: Calcular ventas por producto para la gráfica circular
      const productoContador = {};
      const productoVentas = {};
      
      pedidosFiltrados.forEach(pedido => {
        if (pedido.detalles && Array.isArray(pedido.detalles)) {
          pedido.detalles.forEach(detalle => {
            const nombre = detalle.producto?.nombre || detalle.producto_nombre;
            if (nombre) {
              productoContador[nombre] = (productoContador[nombre] || 0) + detalle.cantidad;
              productoVentas[nombre] = (productoVentas[nombre] || 0) + 
                (parseFloat(detalle.producto?.precio || 0) * detalle.cantidad);
            }
          });
        }
      });

      // Producto más vendido
      const productoMasVendido = Object.keys(productoContador).length > 0
        ? Object.entries(productoContador).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

      // ⭐ NUEVO: Preparar datos para gráfica circular (top 5 productos)
      const productosPorVentas = Object.entries(productoContador)
        .map(([nombre, cantidad]) => ({
          nombre,
          cantidad,
          ventas: productoVentas[nombre] || 0
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5); // Top 5 productos

      // Calcular totales para porcentajes
      const totalCantidad = productosPorVentas.reduce((sum, p) => sum + p.cantidad, 0);
      const totalVentasProductos = productosPorVentas.reduce((sum, p) => sum + p.ventas, 0);

      // Agregar porcentajes
      productosPorVentas.forEach(p => {
        p.porcentaje = totalCantidad > 0 ? (p.cantidad / totalCantidad * 100) : 0;
        p.porcentajeVentas = totalVentasProductos > 0 ? (p.ventas / totalVentasProductos * 100) : 0;
      });

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
        ventasPorDia: generarVentasPorDia(pedidosFiltrados, periodo),
        promedioVenta,
        productosPorVentas
      });
    } catch (error) {
      console.error('Error cargando reportes:', error);
      enqueueSnackbar('Error al cargar reportes', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const generarVentasPorDia = (pedidos, periodo) => {
    const dias = {};
    
    pedidos.forEach(p => {
      const fecha = new Date(p.fecha);
      const fechaKey = fecha.toLocaleDateString('es-ES');
      dias[fechaKey] = (dias[fechaKey] || 0) + parseFloat(p.total || 0);
    });

    return Object.entries(dias)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => {
        // Parsear fechas en formato dd/mm/yyyy
        const [diaA, mesA, añoA] = a.fecha.split('/');
        const [diaB, mesB, añoB] = b.fecha.split('/');
        return new Date(añoA, mesA - 1, diaA) - new Date(añoB, mesB - 1, diaB);
      });
  };

  const exportarPDF = () => {
    try {
      const totalVentas = periodo === 'hoy' ? stats.ventasHoy : periodo === 'semana' ? stats.ventasSemana : stats.ventasMes;
      const nombrePeriodo = periodo === 'hoy' ? 'Diario' : periodo === 'semana' ? 'Semanal' : 'Mensual';
      
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
            <h1>🥐 Panadería Santa Clara</h1>
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

          <div class="table-container">
            <h2 style="color: #5D4037;">Top 5 Productos Más Vendidos</h2>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Ventas</th>
                  <th>% del Total</th>
                </tr>
              </thead>
              <tbody>
                ${stats.productosPorVentas.map(prod => `
                  <tr>
                    <td>${prod.nombre}</td>
                    <td>${prod.cantidad} unidades</td>
                    <td>₡${prod.ventas.toFixed(2)}</td>
                    <td>${prod.porcentaje.toFixed(1)}%</td>
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

      const blob = new Blob([contenidoHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${periodo}_${new Date().toISOString().split('T')[0]}.html`;
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

      enqueueSnackbar('Reporte generado exitosamente. Usa Ctrl+P para guardar como PDF', { 
        variant: 'success',
        autoHideDuration: 5000 
      });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      enqueueSnackbar('Error al exportar reporte', { variant: 'error' });
    }
  };

  // ⭐ NUEVO: Colores para la gráfica circular
  const coloresGrafica = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-yellow-500 to-yellow-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600'
  ];

  const reportCards = [
    {
      title: 'Ventas Hoy',
      value: `₡${stats.ventasHoy.toFixed(2)}`,
      icon: FaDollarSign,
      color: 'from-green-500 to-emerald-600',
      trend: `${periodo === 'hoy' ? stats.pedidosPeriodo : '-'} pedidos`,
      active: periodo === 'hoy'
    },
    {
      title: 'Ventas Semana',
      value: `₡${stats.ventasSemana.toFixed(2)}`,
      icon: FaChartLine,
      color: 'from-blue-500 to-blue-600',
      trend: `${periodo === 'semana' ? stats.pedidosPeriodo : '-'} pedidos`,
      active: periodo === 'semana'
    },
    {
      title: 'Ventas Mes',
      value: `₡${stats.ventasMes.toFixed(2)}`,
      icon: FaChartBar,
      color: 'from-purple-500 to-purple-600',
      trend: `${periodo === 'mes' ? stats.pedidosPeriodo : '-'} pedidos`,
      active: periodo === 'mes'
    },
    {
      title: 'Total Pedidos',
      value: stats.pedidosPeriodo,
      icon: FaShoppingCart,
      color: 'from-orange-500 to-red-600',
      trend: `En ${periodo === 'hoy' ? 'el día' : periodo === 'semana' ? 'la semana' : 'el mes'}`
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
            Ventas por Día
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

        {/* ⭐ NUEVA: Gráfica Circular de Productos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaChartPie className="text-purple-600" />
            Top 5 Productos Vendidos
          </h2>
          {stats.productosPorVentas.length > 0 ? (
            <div className="space-y-4">
              {/* Gráfica de barras horizontal */}
              {stats.productosPorVentas.map((producto, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${coloresGrafica[idx]}`} />
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                        {producto.nombre}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">
                        {producto.cantidad} un.
                      </p>
                      <p className="text-xs text-gray-500">
                        {producto.porcentaje.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${coloresGrafica[idx]} transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${producto.porcentaje}%` }}
                    >
                      {producto.porcentaje > 15 && (
                        <span className="text-xs text-white font-semibold">
                          ₡{producto.ventas.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay datos de productos</p>
          )}
        </motion.div>
      </div>

      {/* Resumen y Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-100"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Resumen General
        </h2>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
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
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all hover:shadow-lg"
        >
          <FaDownload />
          Exportar Reporte {periodo === 'hoy' ? 'Diario' : periodo === 'semana' ? 'Semanal' : 'Mensual'}
        </button>
      </motion.div>
    </div>
  );
}