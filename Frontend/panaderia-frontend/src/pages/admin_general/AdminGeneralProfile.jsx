// Frontend/src/pages/admin_general/AdminGeneralProfile.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaCrown, FaLock, FaUserCircle } from 'react-icons/fa';
import ChangePasswordModal from '../../components/modals/ChangePasswordModal';

export default function AdminGeneralProfile() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const avatarGradient = 'from-purple-500 to-pink-500';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
          <FaUserCircle className="text-white text-2xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#5D4037]">Mi Perfil</h1>
          <p className="text-[#8D6E63]">Administrador General</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6 border border-gray-100">
            <div className="relative inline-block">
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-xl`}>
                <span className="text-5xl font-bold text-white">
                  {user?.first_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <FaCrown className="text-white text-sm" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[#5D4037]">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.username
                }
              </h2>
              <p className="text-[#8D6E63] text-sm">@{user?.username}</p>
              <div className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                👑 Admin General
              </div>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg text-left">
              <div className="flex items-center gap-2 text-purple-800 font-semibold mb-1">
                <FaCrown />
                <span>Acceso Total</span>
              </div>
              <p className="text-purple-700 text-sm">
                Administración de todas las sucursales
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <FaLock />
              Cambiar Contraseña
            </motion.button>
          </div>
        </motion.div>

        {/* Main Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-[#5D4037]">
                  Información de la Cuenta
                </h2>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                  Solo lectura
                </span>
              </div>

              <div className="space-y-5">
                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#5D4037] mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaEnvelope className="text-blue-600 text-sm" />
                    </div>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-5 py-4 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600 cursor-not-allowed font-medium"
                  />
                </div>

                {/* Nombre */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#5D4037] mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaUser className="text-purple-600 text-sm" />
                    </div>
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={user?.first_name || ''}
                    disabled
                    className="w-full px-5 py-4 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600 cursor-not-allowed font-medium"
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#5D4037] mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaUser className="text-green-600 text-sm" />
                    </div>
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={user?.last_name || ''}
                    disabled
                    className="w-full px-5 py-4 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600 cursor-not-allowed font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Privileges Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-2xl p-6 border border-purple-200 shadow-lg"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <FaCrown className="text-purple-600 text-2xl" />
          </div>
          <div>
            <h3 className="font-bold text-[#5D4037] text-lg mb-2">
              Privilegios de Administrador General
            </h3>
            <p className="text-sm text-[#8D6E63] leading-relaxed mb-3">
              Como administrador general, tienes acceso completo a:
            </p>
            <ul className="text-sm text-[#8D6E63] space-y-1">
              <li>✓ Todas las sucursales</li>
              <li>✓ Gestión de usuarios</li>
              <li>✓ Productos y ofertas globales</li>
              <li>✓ Reportes consolidados</li>
              <li>✓ Configuración del sistema</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          console.log('✅ Contraseña actualizada desde perfil admin general');
        }}
      />
    </div>
  );
}