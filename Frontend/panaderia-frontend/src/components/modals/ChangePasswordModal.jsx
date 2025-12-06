// Frontend/src/components/modals/ChangePasswordModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLock, FaTimes, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (passwords.new_password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (passwords.new_password !== passwords.confirm_password) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwords.current_password === passwords.new_password) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/password/cambiar/', {
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });

      console.log('✅ Contraseña cambiada:', res.data);
      
      enqueueSnackbar('¡Contraseña actualizada exitosamente!', {
        variant: 'success',
        autoHideDuration: 3000
      });

      // Reset form
      setPasswords({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ Error cambiando contraseña:', err);
      const errorMsg = err.response?.data?.error || 'Error al cambiar la contraseña';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <FaLock className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Cambiar Contraseña</h2>
                  <p className="text-amber-100 text-sm">
                    Actualiza tu contraseña de acceso
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
          <div className="p-6">
            {/* Error */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Requisitos:</strong>
                <br />
                • Mínimo 8 caracteres
                <br />
                • Debe ser diferente a la contraseña actual
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-[#5D4037] mb-2">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={passwords.current_password}
                    onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all pr-12"
                    placeholder="Tu contraseña actual"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrent ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-[#5D4037] mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={passwords.new_password}
                    onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all pr-12"
                    placeholder="Mínimo 8 caracteres"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNew ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-[#5D4037] mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={passwords.confirm_password}
                    onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all pr-12"
                    placeholder="Confirma tu nueva contraseña"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      <span>Actualizar</span>
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
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}