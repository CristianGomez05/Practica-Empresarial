// Frontend/src/pages/admin_general/AdminGeneralOrders.jsx
// ⭐⭐⭐ CORREGIDO: Filtro por sucursal funcionando correctamente

import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShoppingCart, FaEye, FaCheck, FaTimes, FaClock, FaBox, 
  FaUser, FaPhone, FaMapMarkerAlt, FaCalendar, FaMoneyBillWave, 
  FaSync, FaReceipt, FaTruck, FaStore, FaTrash 
} from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import useSmartRefresh from '../../hooks/useAutoRefresh';
import DeleteOrderModal from '../../components/modals/DeleteOrderModal';

export default function AdminGeneralOrders() {
  const { selectedBranch } = useOutletContext();
  
  const [pedidos, setPedidos] = useState([]);
  const [sucursales, setSucursales] = useState([]); // ⭐ NUEVO
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  // ⭐ NUEVO: Cargar sucursales para mostrar nombres
  const cargarSucursales = useCallback(async () => {
    try {
      const response = await api.get('/sucursales/activas/');
      const data = response.data.results || response.data;
      setSucursales(data);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    }
  }, []);

  const cargarPedidos = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true);
      
      // ⭐ FILTRAR por sucursal si está seleccionada
      const params = selectedBranch ? { sucursal: selectedBranch } : {};
      console.log('🔍 Cargando pedidos con filtro:', params);
      
      const response = await api.get('/pedidos/', { params });
      
      const data = response.data.results || response.data;
      console.log('🛒 Pedidos cargados:', data.length, selectedBranch ? `(Sucursal: ${selectedBranch})` : '(Todas)');
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

  // ⭐ CRÍTICO: Recargar cuando cambia selectedBranch
  useEffect(() => {
    if (!loading) {
      console.log('🔄 selectedBranch cambió a:', selectedBranch);
      cargarPedidos();
    }
  }, [selectedBranch]);

  useSmartRefresh(cargarPedidos, {
    interval: 30000,
    enabled: !showModal && !deleteOrder,
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
      if (selectedPedido?.id === pedidoId) {
        setSelectedPedido(prev => ({ ...prev, estado: nuevoEstado }));
      }
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
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
      await cargarPedidos();
      
      // Cerrar modales si están abiertos
      if (selectedPedido?.id === orderId) {
        setSelectedPedido(null);
        setShowModal(false);
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

  const verDetalle = (pedido) => {
    setSelectedPedido(pedido);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setSelectedPedido(null);
  };

  const getEstadoConfig = (estado) => {
    const configs = {
      recibido: {
        text: 'Recibido',
        bg: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: <FaClock />,
        borderColor: 'border-blue-300'
      },
      en_preparacion: {
        text: 'En Preparación',
        bg: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        icon: <FaBox />,
        borderColor: 'border-yellow-300'
      },
      listo: {
        text: 'Listo',
        bg: 'bg-green-100',
        textColor: 'text-green-700',
        icon: <FaCheck />,
        borderColor: 'border-green-300'
      },
      entregado: {
        text: 'Entregado',
        bg: 'bg-purple-100',
        textColor: 'text-purple-700',
        icon: <FaTruck />,
        borderColor: 'border-purple-300'
      },
      cancelado: {
        text: 'Cancelado',
        bg: 'bg-red-100',
        textColor: 'text-red-700',
        icon: <FaTimes />,
        borderColor: 'border-red-300'
      }
    };
    return configs[estado] || configs.recibido;
  };

  const siguienteEstado = {
    recibido: 'en_preparacion',
    en_preparacion: 'listo',
    listo: 'entregado'
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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <FaShoppingCart className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Gestión de Pedidos</h1>
            <p className="text-[#8D6E63]">
              {pedidos.length} pedidos registrados
              {/* ⭐ Mostrar filtro activo */}
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
          className={`p-3 rounded-xl border-2 border-gray-300 hover:border-purple-500 transition-all ${
            refreshing ? 'animate-spin' : ''
          }`}
          title="Actualizar datos"
        >
          <FaSync className="text-gray-600" />
        </button>
      </div>

      {/* Lista de Pedidos */}
      {pedidos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {selectedBranch
              ? 'No hay pedidos en esta sucursal'
              : 'No hay pedidos registrados'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pedidos.map((pedido, index) => {
            const estadoConfig = getEstadoConfig(pedido.estado);
            const puedeAvanzar = siguienteEstado[pedido.estado];
            
            return (
              <motion.div
                key={pedido.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl shadow-lg border-2 ${estadoConfig.borderColor} overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${estadoConfig.bg} rounded-xl flex items-center justify-center`}>
                        <div className={`text-xl ${estadoConfig.textColor}`}>
                          {estadoConfig.icon}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Pedido #{pedido.id}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`${estadoConfig.bg} ${estadoConfig.textColor} text-xs px-3 py-1 rounded-full font-semibold`}>
                            {estadoConfig.text}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(pedido.fecha).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#5D4037]">
                        ₡{Number(pedido.total).toLocaleString('es-CR')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {pedido.cantidad_items || pedido.detalles?.length || 0} items
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaUser className="text-purple-600" />
                      <span>{pedido.usuario_nombre || pedido.usuario?.username || 'Usuario'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaTruck className="text-purple-600" />
                      <span>{pedido.tipo_entrega_display || (pedido.es_domicilio ? 'Domicilio' : 'Recoger')}</span>
                    </div>
                    {pedido.es_domicilio && pedido.direccion_entrega && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaMapMarkerAlt className="text-purple-600" />
                        <span className="truncate">{pedido.direccion_entrega.substring(0, 30)}...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => verDetalle(pedido)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <FaEye />
                      Ver Detalle
                    </button>
                    {puedeAvanzar && (
                      <button
                        onClick={() => cambiarEstado(pedido.id, puedeAvanzar)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <FaCheck />
                        {getEstadoConfig(puedeAvanzar).text}
                      </button>
                    )}
                    {pedido.puede_eliminarse && (
                      <button
                        onClick={() => setDeleteOrder(pedido)}
                        className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg transition-colors"
                        title="Eliminar pedido"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Detalle de Pedido */}
      <AnimatePresence>
        {showModal && selectedPedido && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={cerrarModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#5D4037]">
                    Pedido #{selectedPedido.id}
                  </h2>
                  <button
                    onClick={cerrarModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>

                {/* Info del Cliente */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <FaUser />
                    Información del Cliente
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedPedido.usuario_nombre || 'Usuario'}
                  </p>
                  {selectedPedido.es_domicilio && selectedPedido.direccion_entrega && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-gray-700">Dirección de entrega:</p>
                      <p className="text-sm text-gray-600">{selectedPedido.direccion_entrega}</p>
                    </div>
                  )}
                </div>

                {/* Productos */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Productos</h3>
                  <div className="space-y-2">
                    {selectedPedido.detalles?.map((detalle) => (
                      <div key={detalle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {detalle.producto?.imagen && (
                            <img
                              src={detalle.producto.imagen}
                              alt={detalle.producto.nombre}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-gray-800">{detalle.producto?.nombre || 'Producto'}</p>
                            <p className="text-sm text-gray-600">Cantidad: {detalle.cantidad}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-800">
                          ₡{(Number(detalle.producto?.precio || 0) * detalle.cantidad).toLocaleString('es-CR')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-800">Total:</span>
                    <span className="text-2xl font-bold text-purple-700">
                      ₡{Number(selectedPedido.total).toLocaleString('es-CR')}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3">
                  {siguienteEstado[selectedPedido.estado] && (
                    <button
                      onClick={() => {
                        cambiarEstado(selectedPedido.id, siguienteEstado[selectedPedido.estado]);
                        cerrarModal();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                    >
                      <FaCheck />
                      Avanzar a {getEstadoConfig(siguienteEstado[selectedPedido.estado]).text}
                    </button>
                  )}
                  <button
                    onClick={cerrarModal}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Eliminación */}
      {deleteOrder && (
        <DeleteOrderModal
          order={deleteOrder}
          onClose={() => setDeleteOrder(null)}
          onConfirm={handleDeleteOrder}
        />
      )}
    </div>
  );
}