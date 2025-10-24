// src/pages/dashboard/DashboardProfile.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../components/auth/AuthContext";
import { FaUser, FaEnvelope, FaCalendar, FaShieldAlt, FaCamera, FaSave, FaTimes } from "react-icons/fa";
import { useSnackbar } from "notistack";

export default function DashboardProfile() {
  const { user, setUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      // Aquí deberías hacer un PATCH a tu API para actualizar el perfil
      // const res = await api.patch("/api/usuarios/me/", form);
      // setUser(res.data);
      
      // Por ahora simulamos el guardado
      setUser({ ...user, ...form });
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
      username: user.username || "",
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
    });
    setEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <FaUser className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#5D4037]">Mi Perfil</h1>
          <p className="text-[#8D6E63]">Administra tu información personal</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar - Avatar & Quick Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 space-y-6"
        >
          {/* Avatar */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-colors border-2 border-white">
                <FaCamera />
              </button>
            </div>
            <h2 className="text-xl font-bold text-[#5D4037] mt-4">
              {user?.username || "Usuario"}
            </h2>
            <p className="text-sm text-[#8D6E63]">{user?.email}</p>
          </div>

          {/* Quick Stats */}
          <div className="space-y-3 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 text-sm">
              <FaShieldAlt className="text-amber-600" />
              <span className="text-[#8D6E63]">
                Rol: <strong className="text-[#5D4037]">{user?.rol || "Cliente"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FaCalendar className="text-amber-600" />
              <span className="text-[#8D6E63]">
                Miembro desde: <strong className="text-[#5D4037]">{formatDate(user?.date_joined)}</strong>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Main Content - Editable Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#5D4037]">
              Información Personal
            </h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shadow-md"
              >
                Editar Perfil
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5D4037] mb-2">
                <FaUser className="text-amber-600" />
                Nombre de Usuario
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={!editing}
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                  editing
                    ? "border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    : "border-gray-200 bg-gray-50"
                }`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5D4037] mb-2">
                <FaEnvelope className="text-amber-600" />
                Correo Electrónico
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!editing}
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                  editing
                    ? "border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    : "border-gray-200 bg-gray-50"
                }`}
              />
            </div>

            {/* First Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5D4037] mb-2">
                <FaUser className="text-amber-600" />
                Nombre
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                disabled={!editing}
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                  editing
                    ? "border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    : "border-gray-200 bg-gray-50"
                }`}
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5D4037] mb-2">
                <FaUser className="text-amber-600" />
                Apellido
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                disabled={!editing}
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                  editing
                    ? "border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    : "border-gray-200 bg-gray-50"
                }`}
              />
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <FaSave />
                  Guardar Cambios
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <FaTimes />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100"
      >
        <h3 className="font-semibold text-[#5D4037] mb-2">
          💡 Información sobre tu cuenta
        </h3>
        <p className="text-sm text-[#8D6E63]">
          Tu información está protegida y solo será utilizada para mejorar tu experiencia
          de compra. Puedes actualizar tus datos en cualquier momento.
        </p>
      </motion.div>
    </div>
  );
}