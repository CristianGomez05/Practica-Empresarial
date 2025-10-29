// Frontend/src/pages/admin/AdminOrders.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClipboardList, FaEye, FaEdit, FaSearch, FaFilter } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, filterEstado, searchTerm]);

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
        label: '📋 Recibido' 
      },
      en_preparacion: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700', 
        label: '👨‍🍳 En Preparación' 
      },
      listo: { 
        bg: 'bg-green-100', 
        text: 'text-green-700', 
        label: '✅ Listo' 
      },
      entregado: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-700', 
        label: '🎉 Entregado' 
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

  const estadosSiguientes = {
    recibido: 'en_preparacion',
    en_preparacion: 'listo',
    listo: 'entregado',
    entregado: null
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

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1 md:w-64">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por # o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
            >
              {estados.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
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
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        #{order.id}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-lg">
                          {order.usuario?.username || 'Cliente'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.fecha).toLocaleString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
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
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors font-semibold"
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

      {/* Modal de Detalles - Ver implementación completa */}
    </div>
  );
}