// Frontend/src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaArrowLeft, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/password/solicitar-recuperacion/`, {
        email: email.trim().toLowerCase()
      });

      console.log('✅ Solicitud enviada:', res.data);
      setSuccess(true);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.error || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

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
            ¡Email Enviado!
          </h2>
          
          <p className="text-[#6D4C41] mb-6">
            Si el email <span className="font-semibold">{email}</span> está registrado, 
            recibirás instrucciones para recuperar tu contraseña.
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
            <p className="text-blue-800 text-sm">
              <strong>📧 Revisa tu correo:</strong>
              <br />
              • Bandeja de entrada
              <br />
              • Spam o correo no deseado
              <br />
              • El enlace es válido por 24 horas
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[#D2691E] font-semibold hover:text-[#8B4513] transition-colors"
          >
            <FaArrowLeft />
            Volver al inicio de sesión
          </Link>
        </motion.div>
      </div>
    );
  }

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
            <FaEnvelope className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-[#5D4037] mb-2">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-[#6D4C41]">
            No te preocupes, te ayudaremos a recuperarla
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

        {/* Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-800 text-sm">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#5D4037] mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#D2B48C] rounded-lg focus:ring-2 focus:ring-[#D2691E] focus:border-transparent transition-all"
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Enviando...
              </span>
            ) : (
              'Enviar Enlace de Recuperación'
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[#6D4C41] hover:text-[#5D4037] transition-colors"
          >
            <FaArrowLeft className="text-sm" />
            <span className="text-sm">Volver al inicio de sesión</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}