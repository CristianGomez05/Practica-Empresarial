//src/pages/admin/AdminOrders.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaClipboardList, FaEye, FaEdit, FaSearch, FaFilter, 
  FaSortAmountDown, FaMapMarkerAlt, FaTruck, FaStore, FaTrash 
} from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import DeleteOrderModal from '../../components/modals/DeleteOrderModal';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);
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

  const getPrioridadPorEstado = (estado) => {
    const prioridades = {
      'recibido': 4,
      'en_preparacion': 3,
      'listo': 2,
      'entregado': 1,
      'cancelado': 0
    };
    return prioridades[estado] || 0;
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (filterEstado !== 'todos') {
      filtered = filtered.filter(order => order.estado === filterEstado);
    }

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toString().includes(searchTerm) ||
        order.usuario?.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'prioridad':
          const prioridadA = getPrioridadPorEstado(a.estado);
          const prioridadB = getPrioridadPorEstado(b.estado);
          
          if (prioridadA !== prioridadB) {
            return prioridadB - prioridadA;
          }
          
          return new Date(a.fecha) - new Date(b.fecha);
        
        case 'mas_antiguo':
          return new Date(a.fecha) - new Date(b.fecha);
        
        case 'mas_reciente':
          return new Date(b.fecha) - new Date(a.fecha);
        
        case 'monto_mayor':
          return parseFloat(b.total) - parseFloat(a.total);
        
        case 'monto_menor':
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
      enqueueSnackbar('Estado actualizado', { variant: 'success' });
      fetchOrders();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      enqueueSnackbar('Error al actualizar estado', { variant: 'error' });
    }
  };

  // ⭐⭐⭐ NUEVA FUNCIÓN: Eliminar pedido
  const handleDeleteOrder = async (orderId) => {
    try {
      console.log('🗑️ Eliminando pedido:', orderId);
      
      const response = await api.delete(`/pedidos/${orderId}/`);
      
      console.log('✅ Respuesta:', response.data);
      
      enqueueSnackbar(
        response.data.message || 'Pedido eliminado exitosamente', 
        { variant: 'success' }
      );
      
      // Actualizar lista
      await fetchOrders();
      
      // Cerrar modales si están abiertos
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      
    } catch (error) {
      console.error('❌ Error eliminando pedido:', error);
      
      if (error.response?.data) {
        const { error: errorMsg, codigo, tiempo_hasta_auto_delete } = error.response.data;
        
        let mensaje = errorMsg || 'Error al eliminar el pedido';
        
        if (tiempo_hasta_auto_delete) {
          mensaje += ` (${tiempo_hasta_auto_delete})`;
        }
        
        enqueueSnackbar(mensaje, { 
          variant: 'error',
          autoHideDuration: 5000 
        });
      } else {
        enqueueSnackbar('Error al eliminar el pedido', { variant: 'error' });
      }
      
      throw error;
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
      },
      cancelado: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        label: '❌ Cancelado',
        priority: '⚫ Cancelado'
      }
    };
    return badges[estado] || badges.recibido;
  };

  const estados = [
    { value: 'todos', label: 'Todos' },
    { value: 'recibido', label: '📋 Recibidos' },
    { value: 'en_preparacion', label: '👨‍🍳 En Preparación' },
    { value: 'listo', label: '✅ Listos' },
    { value: 'entregado', label: '🎉 Entregados' },
    { value: 'cancelado', label: '❌ Cancelados' }
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
    entregado: null,
    cancelado: null
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

      {/* Orders List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredOrders.map((order, index) => {
            const badge = getEstadoBadge(order.estado);
            const siguienteEstado = estadosSiguientes[order.estado];

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-md border-2 border-gray-100 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        #{order.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800 text-lg">
                            {order.usuario?.username || 'Cliente'}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            order.es_domicilio 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {order.es_domicilio ? <FaTruck className="text-xs" /> : <FaStore className="text-xs" />}
                            {order.es_domicilio ? 'Domicilio' : 'Recoger'}
                          </span>
                          
                          {/* ⭐ NUEVO: Badge de auto-delete */}
                          {order.tiempo_hasta_auto_delete && (
                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                              🕐 {order.tiempo_hasta_auto_delete}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>
                            {new Date(order.fecha).toLocaleString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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

                  {/* Dirección si aplica */}
                  {order.es_domicilio && order.direccion_entrega && (
                    <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                      <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="text-blue-600 text-lg mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-blue-800 font-semibold text-sm mb-1">
                            📍 Dirección de entrega:
                          </p>
                          <p className="text-blue-700 text-sm">
                            {order.direccion_entrega}
                          </p>
                        </div>
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
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors font-semibold"
                      >
                        <FaEdit />
                        Marcar como {getEstadoBadge(siguienteEstado).label}
                      </button>
                    )}

                    {/* ⭐⭐⭐ NUEVO: Botón Eliminar */}
                    <button
                      onClick={() => setDeleteOrder(order)}
                      disabled={!order.puede_eliminarse}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold ${
                        order.puede_eliminarse
                          ? 'bg-red-50 hover:bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title={
                        order.puede_eliminarse 
                          ? 'Eliminar pedido' 
                          : 'No se puede eliminar en este estado'
                      }
                    >
                      <FaTrash />
                      Eliminar
                    </button>
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

      {/* ⭐⭐⭐ NUEVO: Modal de Eliminación */}
      <DeleteOrderModal
        isOpen={!!deleteOrder}
        onClose={() => setDeleteOrder(null)}
        onConfirm={handleDeleteOrder}
        order={deleteOrder}
      />
    </div>
  );
}