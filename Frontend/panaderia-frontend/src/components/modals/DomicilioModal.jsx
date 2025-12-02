// Frontend/src/components/modals/DomicilioModal.jsx
// ⭐ MODAL COMPLETO para completar domicilio

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaMapMarkerAlt, FaTimes, FaSave } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import { useAuth } from '../auth/AuthContext';
import api from '../../services/api';

export default function DomicilioModal({ isOpen, onClose, onSuccess }) {
  const { user, setUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [domicilio, setDomicilio] = useState(user?.domicilio || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!domicilio || domicilio.trim() === '') {
      enqueueSnackbar('El domicilio no puede estar vacío', { variant: 'warning' });
      return;
    }

    if (domicilio.trim().length < 10) {
      enqueueSnackbar('Por favor ingresa una dirección más detallada (mínimo 10 caracteres)', {
        variant: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await api.patch('/usuarios/me/', {
        domicilio: domicilio.trim()
      });

      setUser({ ...user, ...res.data });
      
      enqueueSnackbar('¡Domicilio guardado exitosamente!', {
        variant: 'success',
        autoHideDuration: 2000
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error guardando domicilio:', error);
      enqueueSnackbar('Error al guardar el domicilio', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
                    <FaHome className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Configura tu Domicilio</h2>
                    <p className="text-amber-100 text-sm">
                      Necesario para completar tu pedido
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
              {/* Alerta informativa */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-blue-500 text-xl mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-800 font-semibold">
                      ¿Por qué necesitamos tu domicilio?
                    </p>
                    <p className="text-blue-700 text-sm mt-1">
                      Para poder entregar tus pedidos en la dirección correcta. Esta información
                      se guardará en tu perfil y podrás actualizarla cuando lo desees.
                    </p>
                  </div>
                </div>
              </div>

              {/* Campo de domicilio */}
              <div>
                <label className="block text-sm font-semibold text-[#5D4037] mb-3">
                  Dirección Completa de Entrega
                </label>
                <textarea
                  value={domicilio}
                  onChange={(e) => setDomicilio(e.target.value)}
                  placeholder="Ejemplo: San José, Escazú, Residencial Los Cipreses, Casa #25, portón blanco al lado de la soda La Esquina"
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all resize-none"
                  autoFocus
                />
                <p className="text-xs text-gray-600 mt-2">
                  💡 Incluye: Provincia, cantón, barrio, número de casa y referencias útiles
                </p>
              </div>

              {/* Ejemplos */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Ejemplos de domicilios bien escritos:
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• San José, Desamparados, Barrio San Miguel, 200m sur de la iglesia, casa amarilla</li>
                  <li>• Heredia, Santo Domingo, Calle 5, Residencial Las Flores, Casa #12 con portón negro</li>
                  <li>• Alajuela, Centro, frente al Parque Central, Edificio Azul, Apartamento 3B</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading || !domicilio.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <FaSave />
                      <span>Guardar y Continuar</span>
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