// Frontend/src/components/modals/ConfirmarPedidoModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTruck, FaStore, FaMapMarkerAlt, FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useBranch } from '../../contexts/BranchContext';

export default function ConfirmarPedidoModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  user, 
  total,
  itemsCount 
}) {
  const { selectedBranch } = useBranch();
  const [tipoEntrega, setTipoEntrega] = useState('domicilio');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(tipoEntrega);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tieneDomicilio = user?.domicilio && user.domicilio.trim() !== '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <FaCheckCircle className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Confirmar Pedido</h2>
                    <p className="text-amber-100 text-sm">
                      {itemsCount} producto{itemsCount > 1 ? 's' : ''} • Total: ₡{total.toFixed(2)}
                    </p>
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
              {/* Tipo de Entrega */}
              <div>
                <h3 className="text-lg font-bold text-[#5D4037] mb-4">
                  ¿Cómo quieres recibir tu pedido?
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Opción: Entrega a Domicilio */}
                  <button
                    onClick={() => setTipoEntrega('domicilio')}
                    disabled={!tieneDomicilio}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      tipoEntrega === 'domicilio'
                        ? 'border-green-500 bg-green-50'
                        : tieneDomicilio
                        ? 'border-gray-300 hover:border-green-300 bg-white'
                        : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        tipoEntrega === 'domicilio'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        <FaTruck className="text-2xl" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-800">
                          Entrega a Domicilio
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {tieneDomicilio 
                            ? 'Envío gratis a tu dirección'
                            : '⚠️ Configura tu domicilio primero'
                          }
                        </p>
                      </div>
                      {tipoEntrega === 'domicilio' && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <FaCheckCircle className="text-white text-sm" />
                          </div>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Opción: Recoger en Sucursal */}
                  <button
                    onClick={() => setTipoEntrega('recoger')}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      tipoEntrega === 'recoger'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        tipoEntrega === 'recoger'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        <FaStore className="text-2xl" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-800">
                          Recoger en Sucursal
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Retiro en {selectedBranch?.nombre || 'sucursal'}
                        </p>
                      </div>
                      {tipoEntrega === 'recoger' && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <FaCheckCircle className="text-white text-sm" />
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Información según tipo de entrega */}
              {tipoEntrega === 'domicilio' && tieneDomicilio && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-green-500 text-xl mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-green-800 font-semibold mb-1">
                        📍 Dirección de entrega:
                      </p>
                      <p className="text-green-700 text-sm">
                        {user.domicilio}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {tipoEntrega === 'recoger' && selectedBranch && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FaStore className="text-blue-500 text-xl mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-800 font-semibold mb-1">
                        🏪 Recoger en:
                      </p>
                      <p className="text-blue-700 font-bold">
                        {selectedBranch.nombre}
                      </p>
                      {selectedBranch.direccion && (
                        <p className="text-blue-600 text-sm mt-1">
                          {selectedBranch.direccion}
                        </p>
                      )}
                      {selectedBranch.telefono && (
                        <p className="text-blue-600 text-sm">
                          📞 {selectedBranch.telefono}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!tieneDomicilio && tipoEntrega === 'domicilio' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-500 text-xl mt-0.5" />
                    <div>
                      <p className="text-red-800 font-semibold">
                        ⚠️ Domicilio no configurado
                      </p>
                      <p className="text-red-700 text-sm mt-1">
                        Debes agregar tu domicilio en tu perfil antes de seleccionar entrega a domicilio.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen del Pedido */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Resumen del Pedido</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Productos ({itemsCount})</span>
                    <span className="font-semibold">₡{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className="font-semibold text-green-600">Gratis</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-800">Total</span>
                      <span className="text-xl font-bold text-amber-700">₡{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={loading || (tipoEntrega === 'domicilio' && !tieneDomicilio)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      <span>Confirmar Pedido</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}