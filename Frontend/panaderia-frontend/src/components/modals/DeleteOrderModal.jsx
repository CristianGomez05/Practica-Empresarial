//src/components/modals/DeleteOrderModal.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaTimes, FaExclamationTriangle, FaClock } from 'react-icons/fa';

/**
 * Modal de confirmación para eliminar pedidos
 * ⭐ Con validaciones de estado y tiempo
 */
export default function DeleteOrderModal({ isOpen, onClose, onConfirm, order }) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen || !order) return null;

  const handleConfirm = async () => {
    if (confirmText !== 'ELIMINAR') {
      return;
    }

    setLoading(true);
    try {
      await onConfirm(order.id);
      onClose();
    } catch (error) {
      console.error('Error eliminando:', error);
    } finally {
      setLoading(false);
    }
  };

  const puedeEliminar = order.puede_eliminarse;
  const estadoProblematico = ['en_preparacion', 'listo'].includes(order.estado);
  const esperando48h = ['entregado', 'cancelado'].includes(order.estado) && !puedeEliminar;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <FaTrash className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Eliminar Pedido</h2>
                  <p className="text-red-100 text-sm">Pedido #{order.id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Advertencia según estado */}
            {estadoProblematico && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle className="text-red-500 text-xl mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-semibold mb-1">
                      ⚠️ No se puede eliminar
                    </p>
                    <p className="text-red-700 text-sm">
                      Este pedido está en estado "{order.estado_display}". Solo puedes eliminar pedidos en estado "Recibido" o pedidos completados/cancelados después de 48 horas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {esperando48h && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <FaClock className="text-orange-500 text-xl mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-orange-800 font-semibold mb-1">
                      ⏳ Esperando período de 48 horas
                    </p>
                    <p className="text-orange-700 text-sm">
                      Este pedido fue {order.estado_display.toLowerCase()} recientemente. 
                      {order.tiempo_hasta_auto_delete && (
                        <span className="block mt-1 font-semibold">
                          {order.tiempo_hasta_auto_delete}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {puedeEliminar && (
              <>
                {/* Información del pedido */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className="font-semibold">{order.estado_display}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-semibold">{order.usuario_nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">₡{order.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-semibold">
                        {new Date(order.fecha).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Advertencia principal */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold mb-2">
                    ⚠️ Esta acción NO se puede deshacer
                  </p>
                  <p className="text-red-700 text-sm">
                    Se eliminará permanentemente el pedido y todos sus detalles.
                  </p>
                </div>

                {/* Confirmación por texto */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Para confirmar, escribe <span className="text-red-600">ELIMINAR</span>
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="Escribe ELIMINAR"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
                    autoFocus
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirm}
                    disabled={loading || confirmText !== 'ELIMINAR'}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Eliminando...</span>
                      </>
                    ) : (
                      <>
                        <FaTrash />
                        <span>Eliminar Pedido</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {!puedeEliminar && (
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Entendido
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}