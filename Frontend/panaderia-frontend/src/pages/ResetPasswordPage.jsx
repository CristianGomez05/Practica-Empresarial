// Frontend/src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaCheckCircle, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import axios from 'axios';

export default function ResetPasswordPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [passwords, setPasswords] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  // Validar token al cargar
  useEffect(() => {
    validateToken();
  }, [uid, token]);

  const validateToken = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/password/validar-token/`, {
        uid,
        token
      });
      
      if (res.data.valid) {
        setValid(true);
        console.log('✅ Token válido');
      } else {
        setValid(false);
        setError(res.data.error || 'El enlace es inválido o ha expirado');
      }
    } catch (err) {
      console.error('❌ Error validando token:', err);
      setValid(false);
      setError(err.response?.data?.error || 'El enlace es inválido o ha expirado');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (passwords.new_password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (passwords.new_password !== passwords.confirm_password) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/password/restablecer/`, {
        uid,
        token,
        new_password: passwords.new_password
      });

      console.log('✅ Contraseña restablecida:', res.data);
      setSuccess(true);
      
      enqueueSnackbar('¡Contraseña actualizada exitosamente!', { 
        variant: 'success' 
      });

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('❌ Error:', err);
      const errorMsg = err.response?.data?.error || 'Error al restablecer la contraseña';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFE4CC] to-[#FFDAB9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-[#5D4037]">Validando enlace...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFE4CC] to-[#FFDAB9] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaExclamationTriangle className="text-red-600 text-4xl" />
          </div>
          
          <h2 className="text-2xl font-bold text-[#5D4037] mb-4">
            Enlace Inválido o Expirado
          </h2>
          
          <p className="text-[#6D4C41] mb-6">
            {error || 'Este enlace de recuperación ha expirado o no es válido.'}
          </p>

          <Link
            to="/olvide-password"
            className="inline-block bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Solicitar Nuevo Enlace
          </Link>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFE4CC] to-[#FFDAB9] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-green-600 text-4xl" />
          </div>
          
          <h2 className="text-2xl font-bold text-[#5D4037] mb-4">
            ¡Contraseña Actualizada!
          </h2>
          
          <p className="text-[#6D4C41] mb-6">
            Tu contraseña ha sido restablecida exitosamente.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Redirigiendo al inicio de sesión...
          </p>

          <Link
            to="/login"
            className="inline-block bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Ir a Iniciar Sesión
          </Link>
        </motion.div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFE4CC] to-[#FFDAB9] flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FaLock className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-[#5D4037] mb-2">
            Nueva Contraseña
          </h1>
          <p className="text-[#6D4C41]">
            Ingresa tu nueva contraseña
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-red-600" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#5D4037] mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwords.new_password}
                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[#D2B48C] rounded-lg focus:ring-2 focus:ring-[#D2691E] focus:border-transparent transition-all pr-12"
                placeholder="Mínimo 8 caracteres"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Debe tener al menos 8 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5D4037] mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={passwords.confirm_password}
                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[#D2B48C] rounded-lg focus:ring-2 focus:ring-[#D2691E] focus:border-transparent transition-all pr-12"
                placeholder="Confirma tu contraseña"
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

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Actualizando...
              </span>
            ) : (
              'Actualizar Contraseña'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}