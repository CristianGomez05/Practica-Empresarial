// Frontend/src/pages/admin/AdminOrders.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClipboardList, FaEye, FaEdit, FaSearch, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('prioridad');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, filterEstado, searchTerm, sortOrder]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/pedidos/');
      const data = res.data.results || res.data;
      setOrders(data);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      enqueueSnackbar('Error al cargar pedidos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Sistema de prioridades mejorado
  const getPrioridadPorEstado = (estado) => {
    const prioridades = {
      'recibido': 4,        // Máxima prioridad
      'en_preparacion': 3,  // Alta prioridad
      'listo': 2,           // Media prioridad
      'entregado': 1        // Baja prioridad
    };
    return prioridades[estado] || 0;
  };

  const getTiempoEspera = (fecha) => {
    const ahora = new Date();
    const fechaPedido = new Date(fecha);
    const minutos = Math.floor((ahora - fechaPedido) / (1000 * 60));

    if (minutos < 60) {
      return `${minutos} min`;
    } else if (minutos < 1440) {
      const horas = Math.floor(minutos / 60);
      return `${horas}h ${minutos % 60}min`;
    } else {
      const dias = Math.floor(minutos / 1440);
      return `${dias}d ${Math.floor((minutos % 1440) / 60)}h`;
    }
  };

  const getTiempoColor = (fecha, estado) => {
    if (estado === 'entregado') return 'text-gray-400';

    const ahora = new Date();
    const fechaPedido = new Date(fecha);
    const minutos = Math.floor((ahora - fechaPedido) / (1000 * 60));

    if (minutos < 15) return 'text-green-600';
    if (minutos < 30) return 'text-yellow-600';
    if (minutos < 60) return 'text-orange-600';
    return 'text-red-600 font-bold animate-pulse';
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filtrar por estado
    if (filterEstado !== 'todos') {
      filtered = filtered.filter(order => order.estado === filterEstado);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toString().includes(searchTerm) ||
        order.usuario?.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar según la opción seleccionada
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'prioridad':
          // Primero ordenar por prioridad de estado (recibido > en_preparacion > listo > entregado)
          const prioridadA = getPrioridadPorEstado(a.estado);
          const prioridadB = getPrioridadPorEstado(b.estado);
          
          if (prioridadA !== prioridadB) {
            return prioridadB - prioridadA; // Mayor prioridad primero
          }
          
          // Si tienen el mismo estado, ordenar por antigüedad (más antiguos primero = FIFO)
          return new Date(a.fecha) - new Date(b.fecha);
        
        case 'mas_antiguo':
          // Más antiguos primero
          return new Date(a.fecha) - new Date(b.fecha);
        
        case 'mas_reciente':
          // Más recientes primero
          return new Date(b.fecha) - new Date(a.fecha);
        
        case 'monto_mayor':
          // Mayor monto primero
          return parseFloat(b.total) - parseFloat(a.total);
        
        case 'monto_menor':
          // Menor monto primero
          return parseFloat(a.total) - parseFloat(b.total);
        
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const handleChangeEstado = async (orderId, nuevoEstado) => {
    try {
      await api.patch(`/pedidos/${orderId}/cambiar_estado/`, {
        estado: nuevoEstado
      });
      enqueueSnackbar('Estado actualizado y notificación enviada', { 
        variant: 'success' 
      });
      fetchOrders();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      enqueueSnackbar('Error al actualizar estado', { variant: 'error' });
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      recibido: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        label: '📋 Recibido',
        priority: '🔴 Urgente'
      },
      en_preparacion: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700', 
        label: '👨‍🍳 En Preparación',
        priority: '🟡 Alta'
      },
      listo: { 
        bg: 'bg-green-100', 
        text: 'text-green-700', 
        label: '✅ Listo',
        priority: '🟢 Media'
      },
      entregado: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-700', 
        label: '🎉 Entregado',
        priority: '⚪ Completado'
      }
    };
    return badges[estado] || badges.recibido;
  };

  const estados = [
    { value: 'todos', label: 'Todos' },
    { value: 'recibido', label: '📋 Recibidos' },
    { value: 'en_preparacion', label: '👨‍🍳 En Preparación' },
    { value: 'listo', label: '✅ Listos' },
    { value: 'entregado', label: '🎉 Entregados' }
  ];

  const ordenamientos = [
    { value: 'prioridad', label: '🎯 Por Prioridad' },
    { value: 'mas_antiguo', label: '⏰ Más Antiguos' },
    { value: 'mas_reciente', label: '🆕 Más Recientes' },
    { value: 'monto_mayor', label: '💰 Mayor Monto' },
    { value: 'monto_menor', label: '💵 Menor Monto' }
  ];

  const estadosSiguientes = {
    recibido: 'en_preparacion',
    en_preparacion: 'listo',
    listo: 'entregado',
    entregado: null
  };

  // Calcular si un pedido es urgente (más de 30 minutos en estado recibido o en_preparacion)
  const esUrgente = (order) => {
    if (order.estado === 'listo' || order.estado === 'entregado') return false;
    
    const ahora = new Date();
    const fechaPedido = new Date(order.fecha);
    const minutos = Math.floor((ahora - fechaPedido) / (1000 * 60));
    
    return minutos > 30;
  };

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <FaClipboardList className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Gestión de Pedidos</h1>
            <p className="text-[#8D6E63]">{filteredOrders.length} pedidos</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:w-48">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white cursor-pointer"
            >
              {estados.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <FaSortAmountDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white cursor-pointer"
            >
              {ordenamientos.map(orden => (
                <option key={orden.value} value={orden.value}>
                  {orden.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Indicador de ordenamiento activo */}
      {sortOrder === 'prioridad' && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <p className="text-blue-700 text-sm font-semibold">
            🎯 Mostrando pedidos por prioridad: 
            <span className="ml-2">Recibidos → En Preparación → Listos → Entregados</span>
          </p>
          <p className="text-blue-600 text-xs mt-1">
            Dentro de cada estado, los pedidos más antiguos aparecen primero
          </p>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredOrders.map((order, index) => {
            const badge = getEstadoBadge(order.estado);
            const siguienteEstado = estadosSiguientes[order.estado];
            const urgente = esUrgente(order);
            const prioridad = getPrioridadPorEstado(order.estado);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl shadow-md border-2 overflow-hidden hover:shadow-lg transition-all ${
                  urgente ? 'border-red-300 shadow-red-100' : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                        urgente ? 'from-red-500 to-red-600 animate-pulse' : 
                        prioridad === 4 ? 'from-blue-500 to-blue-600' :
                        prioridad === 3 ? 'from-yellow-500 to-yellow-600' :
                        prioridad === 2 ? 'from-green-500 to-green-600' :
                        'from-purple-500 to-purple-600'
                      }`}>
                        #{order.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800 text-lg">
                            {order.usuario?.username || 'Cliente'}
                          </p>
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                            {badge.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-500">
                            {new Date(order.fecha).toLocaleString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className={`font-semibold ${getTiempoColor(order.fecha, order.estado)}`}>
                            ⏱️ {getTiempoEspera(order.fecha)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="text-2xl font-bold text-amber-700">
                        ₡{order.total}
                      </span>
                    </div>
                  </div>

                  {/* Alerta de urgencia */}
                  {urgente && (
                    <div className="mb-4 px-4 py-2 bg-red-50 border-l-4 border-red-500 rounded">
                      <p className="text-red-700 text-sm font-semibold">
                        🚨 Pedido urgente - Requiere atención inmediata
                      </p>
                    </div>
                  )}

                  {/* Items */}
                  {order.detalles && order.detalles.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Productos:</p>
                      <div className="flex flex-wrap gap-2">
                        {order.detalles.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                          >
                            {item.cantidad}x {item.producto?.nombre}
                          </span>
                        ))}
                        {order.detalles.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                            +{order.detalles.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                    >
                      <FaEye />
                      Ver Detalles
                    </button>

                    {siguienteEstado && (
                      <button
                        onClick={() => handleChangeEstado(order.id, siguienteEstado)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold ${
                          urgente 
                            ? 'bg-red-50 hover:bg-red-100 text-red-600 animate-pulse' 
                            : 'bg-green-50 hover:bg-green-100 text-green-600'
                        }`}
                      >
                        <FaEdit />
                        Marcar como {getEstadoBadge(siguienteEstado).label}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredOrders.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl">
            <FaClipboardList className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No se encontraron pedidos</p>
          </div>
        )}
      </div>

      {/* Modal de Detalles - Sin cambios */}
      {selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
                    #{selectedOrder.id}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Detalles del Pedido</h2>
                    <p className="text-purple-100">
                      {selectedOrder.usuario?.username || 'Cliente'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Fecha del Pedido</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(selectedOrder.fecha).toLocaleString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEstadoBadge(selectedOrder.estado).bg} ${getEstadoBadge(selectedOrder.estado).text}`}>
                    {getEstadoBadge(selectedOrder.estado).label}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Tiempo de Espera</p>
                  <p className={`font-semibold ${getTiempoColor(selectedOrder.fecha, selectedOrder.estado)}`}>
                    ⏱️ {getTiempoEspera(selectedOrder.fecha)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Tipo de Pedido</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedOrder.es_oferta 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedOrder.es_oferta ? '🎁 Oferta Especial' : '🛒 Pedido Regular'}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-5 rounded-xl border-2 border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700 mb-1">Total del Pedido</p>
                    {selectedOrder.es_oferta && (
                      <p className="text-xs text-amber-600">✨ Precio con descuento aplicado</p>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-amber-700">
                    ₡{selectedOrder.total}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  🛍️ Productos ({selectedOrder.detalles?.length || 0})
                </h3>
                <div className="space-y-3">
                  {selectedOrder.detalles?.map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                      item.es_oferta 
                        ? 'bg-red-50 border-2 border-red-200 hover:bg-red-100' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br rounded-lg flex items-center justify-center text-white font-bold ${
                          item.es_oferta 
                            ? 'from-red-400 to-red-600' 
                            : 'from-amber-400 to-amber-600'
                        }`}>
                          {item.cantidad}x
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800">
                              {item.producto?.nombre || 'Producto'}
                            </p>
                            {item.es_oferta && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                OFERTA
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            ₡{item.precio_unitario} c/u
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-amber-700">
                        ₡{(parseFloat(item.precio_unitario) * item.cantidad).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                {estadosSiguientes[selectedOrder.estado] && (
                  <button
                    onClick={() => {
                      handleChangeEstado(selectedOrder.id, estadosSiguientes[selectedOrder.estado]);
                      setSelectedOrder(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-colors font-semibold shadow-md"
                  >
                    <FaEdit />
                    Marcar como {getEstadoBadge(estadosSiguientes[selectedOrder.estado]).label}
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}