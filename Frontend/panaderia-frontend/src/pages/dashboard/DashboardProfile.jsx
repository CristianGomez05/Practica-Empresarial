// Frontend/panaderia-frontend/src/pages/dashboard/DashboardProfile.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../components/auth/AuthContext";
import { FaUser, FaEnvelope, FaSave, FaTimes, FaUserCircle, FaEdit, FaCheckCircle } from "react-icons/fa";
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
  });

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const res = await api.patch("/usuarios/me/", {
        first_name: form.first_name,
        last_name: form.last_name,
      });
      
      setUser({ ...user, ...res.data });
      setEditing(false);
      enqueueSnackbar("Perfil actualizado exitosamente", {
        variant: "success",
        autoHideDuration: 3000,
      });
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      enqueueSnackbar("Error al actualizar perfil", { variant: "error" });
    }
  };

  const handleCancel = () => {
    setForm({
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
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
          <h1 className="text-4xl font-bold text-[#5D4037] tracking-tight">Mi Perfil</h1>
          <p className="text-[#8D6E63] text-lg">Administra tu información personal</p>
        </div>
      </motion.div>

      {/* Main Profile Card */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar - Avatar & Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 space-y-6 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>
            
            {/* Avatar */}
            <div className="relative text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative inline-block"
              >
                <div className={`w-36 h-36 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-6xl font-bold shadow-2xl border-4 border-white relative z-10`}>
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                
                {/* Decorative ring */}
                <div className="absolute inset-0 rounded-full border-4 border-amber-200 animate-pulse"></div>
              </motion.div>
              
              <h2 className="text-2xl font-bold text-[#5D4037] mt-4">
                {user?.username || "Usuario"}
              </h2>
              <p className="text-sm text-[#8D6E63] flex items-center justify-center gap-2 mt-1">
                <FaEnvelope className="text-amber-600" />
                {user?.email}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <div className="text-3xl font-bold text-amber-600">
                  {user?.pedidos_count || 0}
                </div>
                <div className="text-xs text-[#8D6E63] font-medium">Pedidos</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="text-3xl font-bold text-green-600">5★</div>
                <div className="text-xs text-[#8D6E63] font-medium">Valoración</div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-blue-900 text-center leading-relaxed">
                <span className="font-semibold">💡 Consejo:</span> Mantén tu información actualizada para recibir ofertas personalizadas
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content - Editable Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-amber-100 to-orange-100 rounded-full blur-3xl opacity-50 -ml-20 -mb-20"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-[#5D4037] flex items-center gap-2">
                    <FaUser className="text-amber-600" />
                    Información Personal
                  </h3>
                  <p className="text-sm text-[#8D6E63] mt-1">
                    {editing ? "Edita tus datos personales" : "Visualiza tu información"}
                  </p>
                </div>
                {!editing && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditing(true)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <FaEdit />
                    Editar Perfil
                  </motion.button>
                )}
              </div>

              <div className="space-y-6">
                {/* Email (solo lectura) */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#5D4037] mb-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <FaEnvelope className="text-amber-600 text-sm" />
                    </div>
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={form.email}
                      disabled
                      className="w-full px-5 py-4 border-2 border-gray-200 bg-gray-50 rounded-xl text-gray-600 font-medium transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <FaCheckCircle className="text-green-500" />
                    </div>
                  </div>
                  <p className="text-xs text-[#8D6E63] mt-2 ml-1">
                    🔒 Tu correo está verificado y no puede ser modificado
                  </p>
                </div>

                {/* First Name */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#5D4037] mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaUser className="text-blue-600 text-sm" />
                    </div>
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    disabled={!editing}
                    placeholder="Ingresa tu nombre"
                    className={`w-full px-5 py-4 border-2 rounded-xl transition-all font-medium ${
                      editing
                        ? "border-amber-300 bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 hover:border-amber-400"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}
                  />
                </div>

                {/* Last Name */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#5D4037] mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaUser className="text-purple-600 text-sm" />
                    </div>
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    disabled={!editing}
                    placeholder="Ingresa tu apellido"
                    className={`w-full px-5 py-4 border-2 rounded-xl transition-all font-medium ${
                      editing
                        ? "border-amber-300 bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 hover:border-amber-400"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}
                  />
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