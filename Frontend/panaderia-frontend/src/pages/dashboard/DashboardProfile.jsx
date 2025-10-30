// Frontend/panaderia-frontend/src/pages/dashboard/DashboardProfile.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../components/auth/AuthContext";
import { FaUser, FaEnvelope, FaCamera, FaSave, FaTimes, FaUpload } from "react-icons/fa";
import { useSnackbar } from "notistack";
import api from "../../services/api";

export default function DashboardProfile() {
  const { user, setUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    avatar: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const res = await api.patch("/usuarios/me/", {
        first_name: form.first_name,
        last_name: form.last_name,
        avatar: form.avatar,
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
      avatar: user.avatar || "",
    });
    setEditing(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar("Por favor selecciona una imagen válida", { variant: "error" });
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar("La imagen debe ser menor a 5MB", { variant: "error" });
      return;
    }

    setUploading(true);
    try {
      // Convertir a base64 para preview inmediato
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        
        // Actualizar preview local
        setForm({ ...form, avatar: base64Image });
        
        // Subir a un servicio de imágenes (Cloudinary, ImgBB, etc.)
        // Por ahora, guardamos el base64 directamente
        // En producción, deberías usar un servicio externo
        
        try {
          // Opción 1: Guardar base64 directamente (no recomendado para producción)
          const res = await api.patch("/usuarios/me/", {
            avatar: base64Image,
          });
          
          setUser({ ...user, avatar: base64Image });
          enqueueSnackbar("Foto de perfil actualizada", { variant: "success" });
        } catch (error) {
          console.error("Error guardando avatar:", error);
          enqueueSnackbar("Error al guardar la foto", { variant: "error" });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error procesando imagen:", error);
      enqueueSnackbar("Error al procesar la imagen", { variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUrl = async () => {
    const url = prompt("Ingresa la URL de la imagen:");
    if (!url) return;

    try {
      setUploading(true);
      const res = await api.patch("/usuarios/me/", {
        avatar: url,
      });
      
      setForm({ ...form, avatar: url });
      setUser({ ...user, avatar: url });
      enqueueSnackbar("Foto de perfil actualizada", { variant: "success" });
    } catch (error) {
      console.error("Error guardando avatar:", error);
      enqueueSnackbar("Error al guardar la foto", { variant: "error" });
    } finally {
      setUploading(false);
    }
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
              {form.avatar ? (
                <img
                  src={form.avatar}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-amber-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              
              {/* Upload Button */}
              <div className="absolute bottom-0 right-0 flex gap-1">
                <label className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-colors border-2 border-white cursor-pointer">
                  <FaCamera />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <button
                  onClick={handleImageUrl}
                  disabled={uploading}
                  className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors border-2 border-white"
                  title="Usar URL de imagen"
                >
                  <FaUpload className="text-sm" />
                </button>
              </div>

              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#5D4037] mt-4">
              {user?.username || "Usuario"}
            </h2>
            <p className="text-sm text-[#8D6E63]">{user?.email}</p>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
            <p className="text-xs text-[#8D6E63] text-center">
              💡 Haz clic en la cámara para subir tu foto o en la flecha para usar una URL
            </p>
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
            {/* Email (solo lectura) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5D4037] mb-2">
                <FaEnvelope className="text-amber-600" />
                Correo Electrónico
              </label>
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg"
                title="El correo no puede ser modificado"
              />
              <p className="text-xs text-[#8D6E63] mt-1">
                El correo no puede ser modificado
              </p>
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
                placeholder="Ingresa tu nombre"
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
                placeholder="Ingresa tu apellido"
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
          🔒 Seguridad y Privacidad
        </h3>
        <p className="text-sm text-[#8D6E63]">
          Tu información está protegida y solo será utilizada para mejorar tu experiencia
          de compra. La foto de perfil se almacena de forma segura y puedes cambiarla en cualquier momento.
        </p>
      </motion.div>
    </div>
  );
}