// src/components/modals/OrderDetailsModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUser, FaPhone, FaMapMarkerAlt, FaTruck, FaStore, FaCalendar, FaClock } from 'react-icons/fa';

export default function OrderDetailsModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const getEstadoBadge = (estado) => {
    const badges = {
      recibido: { bg: 'bg-blue-100', text: 'text-blue-700', label: '📋 Recibido' },
      en_preparacion: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '👨‍🍳 En Preparación' },
      listo: { bg: 'bg-green-100', text: 'text-green-700', label: '✅ Listo' },
      entregado: { bg: 'bg-purple-100', text: 'text-purple-700', label: '🎉 Entregado' },
      cancelado: { bg: 'bg-red-100', text: 'text-red-700', label: '❌ Cancelado' }
    };
    return badges[estado] || badges.recibido;
  };

  const badge = getEstadoBadge(order.estado);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      #{order.id}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Detalles del Pedido
                      </h2>
                      <p className="text-purple-100 text-sm">
                        {new Date(order.fecha).toLocaleString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  {/* Estado y Tipo de Entrega */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-2">Estado del Pedido</p>
                      <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-2">Tipo de Entrega</p>
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                        order.es_domicilio 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {order.es_domicilio ? <FaTruck /> : <FaStore />}
                        {order.es_domicilio ? 'Entrega a Domicilio' : 'Recoger en Tienda'}
                      </span>
                    </div>
                  </div>

                  {/* Información del Cliente */}
                  <div className="bg-blue-50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <FaUser className="text-blue-600" />
                      Información del Cliente
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-medium">Nombre:</span>
                        <span className="text-blue-900">
                          {order.usuario?.first_name && order.usuario?.last_name
                            ? `${order.usuario.first_name} ${order.usuario.last_name}`
                            : order.usuario?.username || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-medium">Usuario:</span>
                        <span className="text-blue-900">{order.usuario?.username || 'N/A'}</span>
                      </div>
                      {order.usuario?.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-700 font-medium">Email:</span>
                          <span className="text-blue-900">{order.usuario.email}</span>
                        </div>
                      )}
                      {order.usuario?.telefono && (
                        <div className="flex items-center gap-2">
                          <FaPhone className="text-blue-600" />
                          <span className="text-blue-700 font-medium">Teléfono:</span>
                          <span className="text-blue-900">{order.usuario.telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dirección de Entrega */}
                  {order.es_domicilio && order.direccion_entrega && (
                    <div className="bg-green-50 rounded-xl p-4 mb-6 border-l-4 border-green-500">
                      <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-green-600" />
                        Dirección de Entrega
                      </h3>
                      <p className="text-green-900">{order.direccion_entrega}</p>
                    </div>
                  )}

                  {/* Sucursal para Recoger */}
                  {!order.es_domicilio && order.productos && order.productos.length > 0 && (
                    <div className="bg-purple-50 rounded-xl p-4 mb-6 border-l-4 border-purple-500">
                      <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                        <FaStore className="text-purple-600" />
                        Recoger en Sucursal
                      </h3>
                      <p className="text-purple-900">
                        {order.productos[0].producto?.sucursal_nombre || 'Sucursal Principal'}
                      </p>
                    </div>
                  )}

                  {/* Observaciones */}
                  {order.observaciones && (
                    <div className="bg-yellow-50 rounded-xl p-4 mb-6 border-l-4 border-yellow-500">
                      <h3 className="font-semibold text-yellow-900 mb-2">📝 Observaciones</h3>
                      <p className="text-yellow-900">{order.observaciones}</p>
                    </div>
                  )}

                  {/* Productos */}
                  <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6">
                    <div className="bg-gray-50 px-4 py-3 border-b-2 border-gray-200">
                      <h3 className="font-semibold text-gray-900">🛒 Productos del Pedido</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {order.productos && order.productos.length > 0 ? (
                        order.productos.map((item, index) => (
                          <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4 flex-1">
                              {item.producto?.imagen_url && (
                                <img
                                  src={item.producto.imagen_url}
                                  alt={item.producto.nombre}
                                  className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {item.producto?.nombre || 'Producto'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Cantidad: {item.cantidad} × ₡{item.precio_unitario}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-amber-700">
                                ₡{item.subtotal}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No hay productos en este pedido
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-4">
                    <div className="flex items-center justify-between text-white">
                      <span className="text-lg font-semibold">Total del Pedido:</span>
                      <span className="text-3xl font-bold">₡{order.total}</span>
                    </div>
                  </div>

                  {/* Información Adicional */}
                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaCalendar className="text-gray-400" />
                      <span>Creado: {new Date(order.fecha).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaClock className="text-gray-400" />
                      <span>Hora: {new Date(order.fecha).toLocaleTimeString('es-ES')}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}