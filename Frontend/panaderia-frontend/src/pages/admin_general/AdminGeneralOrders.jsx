// Frontend/src/pages/admin_general/AdminGeneralOrders.jsx
// ⭐⭐⭐ MEJORADO: Usando OrderDetailsModal profesional

import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShoppingCart, FaEye, FaCheck, FaTimes, FaClock, FaBox, 
  FaUser, FaPhone, FaMapMarkerAlt, FaCalendar, FaMoneyBillWave, 
  FaSync, FaTruck, FaStore, FaTrash 
} from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import useSmartRefresh from '../../hooks/useAutoRefresh';
import DeleteOrderModal from '../../components/modals/DeleteOrderModal';
import OrderDetailsModal from '../../components/modals/OrderDetailsModal'; // ⭐ NUEVO

export default function AdminGeneralOrders() {
  const { selectedBranch } = useOutletContext();
  
  const [pedidos, setPedidos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);

  const { enqueueSnackbar } = useSnackbar();

  const cargarSucursales = useCallback(async () => {
    try {
      const response = await api.get('/sucursales/activas/');
      const data = response.data.results || response.data;
      setSucursales(data);
    } catch (error) {
      console.error('❌ Error cargando sucursales:', error);
    }
  }, []);

  const cargarPedidos = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true);
      
      const params = selectedBranch ? { sucursal: selectedBranch } : {};
      console.log('🔍 Cargando pedidos con params:', params);
      
      const response = await api.get('/pedidos/', { params });
      
      const data = response.data.results || response.data;
      console.log('🛒 Pedidos cargados:', data.length, selectedBranch ? `(Sucursal ID: ${selectedBranch})` : '(Todas)');
      setPedidos(data);
      
      if (refreshing) {
        enqueueSnackbar('Datos actualizados', { variant: 'info', autoHideDuration: 2000 });
      }
    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
      if (!loading) {
        enqueueSnackbar('Error al cargar pedidos', { variant: 'error' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, refreshing, selectedBranch, enqueueSnackbar]);

  useEffect(() => {
    cargarPedidos();
    cargarSucursales();
  }, []);

  useEffect(() => {
    if (!loading) {
      console.log('🔄 selectedBranch cambió a:', selectedBranch);
      cargarPedidos();
    }
  }, [selectedBranch]);

  useSmartRefresh(cargarPedidos, {
    interval: 30000,
    enabled: !selectedPedido && !deleteOrder, // ⭐ Actualizado
    refreshOnFocus: true
  });

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      await api.patch(`/pedidos/${pedidoId}/cambiar_estado/`, { 
        estado: nuevoEstado 
      });
      enqueueSnackbar(`Estado actualizado a: ${getEstadoConfig(nuevoEstado).text}`, { 
        variant: 'success' 
      });
      await cargarPedidos();
      
      // ⭐ Actualizar el pedido seleccionado si está abierto el modal
      if (selectedPedido?.id === pedidoId) {
        const updatedOrder = pedidos.find(p => p.id === pedidoId);
        if (updatedOrder) {
          setSelectedPedido({ ...updatedOrder, estado: nuevoEstado });
        }
      }
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      enqueueSnackbar('Error al actualizar estado', { variant: 'error' });
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      console.log('🗑️ Eliminando pedido:', orderId);
      
      const response = await api.delete(`/pedidos/${orderId}/`);
      
      console.log('✅ Respuesta:', response.data);
      
      enqueueSnackbar(
        response.data.message || 'Pedido eliminado exitosamente', 
        { variant: 'success' }
      );
      
      await cargarPedidos();
      
      if (selectedPedido?.id === orderId) {
        setSelectedPedido(null);
      }
      setDeleteOrder(null);
      
    } catch (error) {
      console.error('❌ Error eliminando pedido:', error);
      
      if (error.response?.data) {
        const { error: errorMsg, tiempo_hasta_auto_delete } = error.response.data;
        
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

  const getEstadoConfig = (estado) => {
    const configs = {
      recibido: {
        text: 'Recibido',
        bg: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300',
        icon: <FaClock />,
        buttonColor: 'bg-blue-500 hover:bg-blue-600',
        label: '📋 Recibido'
      },
      en_preparacion: {
        text: 'En Preparación',
        bg: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
        icon: <FaBox />,
        buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
        label: '👨‍🍳 En Preparación'
      },
      listo: {
        text: 'Listo',
        bg: 'bg-purple-100',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-300',
        icon: <FaCheck />,
        buttonColor: 'bg-purple-500 hover:bg-purple-600',
        label: '✅ Listo'
      },
      entregado: {
        text: 'Entregado',
        bg: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-300',
        icon: <FaCheck />,
        buttonColor: 'bg-green-500 hover:bg-green-600',
        label: '🎉 Entregado'
      },
      cancelado: {
        text: 'Cancelado',
        bg: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-300',
        icon: <FaTimes />,
        buttonColor: 'bg-red-500 hover:bg-red-600',
        label: '❌ Cancelado'
      }
    };
    return configs[estado] || configs.recibido;
  };

  const getEstadosSiguientes = (estadoActual) => {
    const flujo = {
      recibido: ['en_preparacion', 'cancelado'],
      en_preparacion: ['listo', 'cancelado'],
      listo: ['entregado', 'cancelado'],
      entregado: [],
      cancelado: []
    };
    return flujo[estadoActual] || [];
  };

  const stats = {
    total: pedidos.length,
    recibidos: pedidos.filter(p => p.estado === 'recibido').length,
    en_preparacion: pedidos.filter(p => p.estado === 'en_preparacion').length,
    listos: pedidos.filter(p => p.estado === 'listo').length,
    entregados: pedidos.filter(p => p.estado === 'entregado').length,
    cancelados: pedidos.filter(p => p.estado === 'cancelado').length,
    totalVentas: pedidos
      .filter(p => p.estado === 'entregado')
      .reduce((sum, p) => sum + parseFloat(p.total || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <FaShoppingCart className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Gestión de Pedidos</h1>
            <p className="text-[#8D6E63]">
              {pedidos.length} pedidos registrados
              {selectedBranch && sucursales.length > 0 && (
                <span className="ml-2 text-purple-600 font-semibold">
                  • {sucursales.find(s => s.id === selectedBranch)?.nombre || 'Filtrado'}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={cargarPedidos}
          disabled={refreshing}
          className={`p-3 rounded-xl border-2 border-gray-300 hover:border-blue-500 transition-all ${
            refreshing ? 'animate-spin' : ''
          }`}
          title="Actualizar datos"
        >
          <FaSync className="text-gray-600" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-400">
          <p className="text-sm text-gray-600">Recibidos</p>
          <p className="text-2xl font-bold text-gray-800">{stats.recibidos}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">En Preparación</p>
          <p className="text-2xl font-bold text-gray-800">{stats.en_preparacion}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Listos</p>
          <p className="text-2xl font-bold text-gray-800">{stats.listos}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Entregados</p>
          <p className="text-2xl font-bold text-gray-800">{stats.entregados}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-amber-500">
          <p className="text-sm text-gray-600">Total Ventas</p>
          <p className="text-xl font-bold text-gray-800">₡{stats.totalVentas.toLocaleString('es-CR')}</p>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        <AnimatePresence>
          {pedidos.map((pedido) => {
            const estado = getEstadoConfig(pedido.estado);
            return (
              <motion.div
                key={pedido.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-white rounded-xl shadow-lg border-2 ${estado.borderColor} overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`${estado.bg} ${estado.textColor} p-3 rounded-lg`}>
                        {estado.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold text-[#5D4037]">
                            Pedido #{pedido.id}
                          </h3>
                          <span className={`${estado.bg} ${estado.textColor} px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1`}>
                            {estado.icon}
                            {estado.text}
                          </span>
                          
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                            pedido.es_domicilio 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {pedido.es_domicilio ? <FaTruck /> : <FaStore />}
                            {pedido.tipo_entrega_display || (pedido.es_domicilio ? 'Domicilio' : 'Recoger')}
                          </span>

                          {pedido.tiempo_hasta_auto_delete && (
                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                              🕐 {pedido.tiempo_hasta_auto_delete}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-3 text-sm text-[#8D6E63]">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-purple-600" />
                            <span className="font-semibold">
                              {pedido.usuario?.username || 'Cliente'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaCalendar className="text-blue-600" />
                            <span>
                              {new Date(pedido.fecha).toLocaleString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {pedido.telefono && (
                            <div className="flex items-center gap-2">
                              <FaPhone className="text-green-600" />
                              <span>{pedido.telefono}</span>
                            </div>
                          )}
                          {pedido.sucursal?.nombre && (
                            <div className="flex items-center gap-2">
                              <FaBox className="text-amber-600" />
                              <span className="font-semibold text-purple-600">
                                {pedido.sucursal.nombre}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <FaMoneyBillWave className="text-amber-600" />
                            <span className="font-bold text-[#5D4037]">
                              ₡{parseFloat(pedido.total || 0).toLocaleString('es-CR')}
                            </span>
                          </div>
                        </div>

                        {pedido.es_domicilio && pedido.direccion_entrega && (
                          <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                            <div className="flex items-start gap-2">
                              <FaMapMarkerAlt className="text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-blue-800 font-semibold text-xs mb-1">
                                  📍 Dirección de entrega:
                                </p>
                                <p className="text-blue-700 text-xs">
                                  {pedido.direccion_entrega}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {pedido.es_recoger && (
                          <div className="mt-3 p-3 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
                            <div className="flex items-start gap-2">
                              <FaStore className="text-purple-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-purple-800 font-semibold text-xs">
                                  🏪 Cliente recogerá el pedido en sucursal
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {pedido.detalles?.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700">
                              {item.cantidad}x {item.producto?.nombre || 'Producto'}
                            </span>
                          ))}
                          {pedido.detalles?.length > 3 && (
                            <span className="bg-purple-100 px-3 py-1 rounded-full text-xs text-purple-700 font-semibold">
                              +{pedido.detalles.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedPedido(pedido)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <FaEye />
                      Ver Detalle
                    </button>
                    
                    {getEstadosSiguientes(pedido.estado).map((siguienteEstado) => {
                      const config = getEstadoConfig(siguienteEstado);
                      return (
                        <button
                          key={siguienteEstado}
                          onClick={() => cambiarEstado(pedido.id, siguienteEstado)}
                          className={`flex items-center gap-2 ${config.buttonColor} text-white px-4 py-2 rounded-lg transition-colors`}
                        >
                          {config.icon}
                          Marcar como {config.text}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setDeleteOrder(pedido)}
                      disabled={!pedido.puede_eliminarse}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold ${
                        pedido.puede_eliminarse
                          ? 'bg-red-50 hover:bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title={
                        pedido.puede_eliminarse 
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
      </div>

      {pedidos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {selectedBranch 
              ? 'No hay pedidos en esta sucursal' 
              : 'No hay pedidos registrados'
            }
          </p>
        </div>
      )}

      {/* ⭐⭐⭐ NUEVO: Modal Profesional de Detalles */}
      <OrderDetailsModal
        isOpen={!!selectedPedido}
        onClose={() => setSelectedPedido(null)}
        order={selectedPedido}
      />

      {/* Modal de Eliminación */}
      <DeleteOrderModal
        isOpen={!!deleteOrder}
        onClose={() => setDeleteOrder(null)}
        onConfirm={handleDeleteOrder}
        order={deleteOrder}
      />
    </div>
  );
}