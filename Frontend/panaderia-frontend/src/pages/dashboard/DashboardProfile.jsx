// Frontend/src/pages/dashboard/DashboardProfile.jsx
// ⭐ ACTUALIZADO: Guardar domicilio correctamente usando setUser

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../components/auth/AuthContext";
import { FaUser, FaEnvelope, FaSave, FaTimes, FaUserCircle, FaEdit, FaCheckCircle, FaHome, FaMapMarkerAlt } from "react-icons/fa";
import { useSnackbar } from "notistack";
import api from "../../services/api";

export default function DashboardProfile() {
  const { user, setUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    domicilio: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        domicilio: user.domicilio || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    // ⭐ Validación de domicilio
    if (!form.domicilio || form.domicilio.trim() === "") {
      enqueueSnackbar("El domicilio es obligatorio", {
        variant: "warning",
        autoHideDuration: 3000,
      });
      return;
    }

    if (form.domicilio.trim().length < 10) {
      enqueueSnackbar("Por favor ingresa una dirección más detallada (mínimo 10 caracteres)", {
        variant: "warning",
        autoHideDuration: 3000,
      });
      return;
    }

    try {
      console.log('\n' + '='.repeat(60));
      console.log('💾 Guardando perfil del usuario');
      console.log('='.repeat(60));
      console.log('📝 Datos a enviar:', {
        first_name: form.first_name,
        last_name: form.last_name,
        domicilio: form.domicilio.substring(0, 50) + '...'
      });

      const res = await api.patch("/usuarios/me/", {
        first_name: form.first_name,
        last_name: form.last_name,
        domicilio: form.domicilio,
      });

      console.log('✅ Respuesta del servidor:', res.data);

      // ⭐ CRÍTICO: Actualizar usuario completo usando setUser del contexto
      // Esto guardará automáticamente en localStorage
      const updatedUser = {
        ...user,
        ...res.data,
        domicilio: res.data.domicilio,
        tiene_domicilio: res.data.tiene_domicilio
      };

      console.log('🔄 Actualizando contexto con:', {
        username: updatedUser.username,
        domicilio: updatedUser.domicilio?.substring(0, 50) + '...',
        tiene_domicilio: updatedUser.tiene_domicilio
      });

      setUser(updatedUser);

      console.log('✅ Contexto actualizado');
      console.log('='.repeat(60) + '\n');

      setEditing(false);
      enqueueSnackbar("Perfil actualizado exitosamente", {
        variant: "success",
        autoHideDuration: 3000,
      });
    } catch (error) {
      console.error("❌ Error actualizando perfil:", error);
      console.error("   Detalles:", error.response?.data);
      enqueueSnackbar("Error al actualizar perfil", { variant: "error" });
    }
  };

  const handleCancel = () => {
    setForm({
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      domicilio: user.domicilio || "",
    });
    setEditing(false);
  };

  // Generar color único basado en el username
  const getAvatarColor = (username) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-amber-500 to-orange-500',
    ];
    const index = username?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const avatarGradient = getAvatarColor(user?.username);

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4">
      {/* Header con animación */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
          <FaUserCircle className="text-white text-2xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#5D4037]">Mi Perfil</h1>
          <p className="text-[#8D6E63]">Administra tu información personal</p>
        </div>
      </motion.div>

      {/* ⭐ Alerta si no tiene domicilio */}
      {!user?.domicilio && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <FaMapMarkerAlt className="text-red-500 text-xl" />
            <div>
              <p className="text-red-800 font-semibold">⚠️ Domicilio no configurado</p>
              <p className="text-red-700 text-sm">
                Debes agregar tu domicilio para poder realizar pedidos
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar - Avatar */}
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
                  {user?.first_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <FaCheckCircle className="text-white text-sm" />
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
            </div>

            {!editing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditing(true)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <FaEdit />
                Editar Perfil
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Main Form */}
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
                  Información Personal
                </h2>
                {editing && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full animate-pulse">
                    Modo Edición
                  </span>
                )}
              </div>

              <div className="space-y-5">
                {/* Email (readonly) */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#5D4037] mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaEnvelope className="text-blue-600 text-sm" />
                    </div>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full px-5 py-4 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-medium"
                  />
                  <p className="text-xs text-gray-500 mt-2 ml-1">
                    El correo no se puede modificar
                  </p>
                </div>

                {/* Nombre */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#5D4037] mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaUser className="text-purple-600 text-sm" />
                    </div>
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    disabled={!editing}
                    placeholder="Ingresa tu nombre"
                    className={`w-full px-5 py-4 border-2 rounded-xl transition-all font-medium ${editing
                        ? "border-amber-300 bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 hover:border-amber-400"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                      }`}
                  />
                </div>

                {/* Apellido */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#5D4037] mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaUser className="text-green-600 text-sm" />
                    </div>
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    disabled={!editing}
                    placeholder="Ingresa tu apellido"
                    className={`w-full px-5 py-4 border-2 rounded-xl transition-all font-medium ${editing
                        ? "border-amber-300 bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 hover:border-amber-400"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                      }`}
                  />
                </div>

                {/* ⭐ Campo Domicilio */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#5D4037] mb-3">
                    <div className={`w-8 h-8 ${user?.domicilio ? 'bg-green-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                      <FaHome className={`${user?.domicilio ? 'text-green-600' : 'text-red-600'} text-sm`} />
                    </div>
                    Domicilio {!user?.domicilio && <span className="text-red-500 text-xs">(Obligatorio para pedidos)</span>}
                  </label>
                  <textarea
                    value={form.domicilio}
                    onChange={(e) => setForm({ ...form, domicilio: e.target.value })}
                    disabled={!editing}
                    placeholder="Ingresa tu dirección completa de entrega (provincia, cantón, barrio, número de casa, referencias...)"
                    rows={3}
                    className={`w-full px-5 py-4 border-2 rounded-xl transition-all font-medium resize-none ${editing
                        ? "border-amber-300 bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 hover:border-amber-400"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                      }`}
                  />
                  {!user?.domicilio && editing && (
                    <p className="text-xs text-red-600 mt-2 ml-1 flex items-center gap-1">
                      <FaMapMarkerAlt />
                      Debes agregar tu domicilio para poder realizar pedidos
                    </p>
                  )}
                  {user?.domicilio && !editing && (
                    <p className="text-xs text-green-600 mt-2 ml-1 flex items-center gap-1">
                      <FaCheckCircle />
                      Domicilio configurado correctamente
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                {editing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 pt-6"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      <FaSave className="text-lg" />
                      Guardar Cambios
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancel}
                      className="px-6 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                      <FaTimes className="text-lg" />
                      Cancelar
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Security Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-6 border border-amber-200 shadow-lg"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-2xl">🔒</span>
          </div>
          <div>
            <h3 className="font-bold text-[#5D4037] text-lg mb-2">
              Seguridad y Privacidad
            </h3>
            <p className="text-sm text-[#8D6E63] leading-relaxed">
              Tu información está protegida con encriptación de última generación y solo será
              utilizada para mejorar tu experiencia de compra. Nos tomamos muy en serio la
              seguridad de tus datos personales.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}