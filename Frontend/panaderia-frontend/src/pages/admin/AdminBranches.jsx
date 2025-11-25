// Frontend/src/pages/admin/AdminBranches.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStore, FaPlus, FaEdit, FaTrash, FaPhone, FaMapMarkerAlt, FaTimes, FaSync, FaCheck } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

export default function AdminBranches() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    activa: true
  });
  const { enqueueSnackbar } = useSnackbar();

  const cargarSucursales = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true);
      
      const response = await api.get('/sucursales/');
      const data = response.data.results || response.data;
      console.log('🏪 Sucursales cargadas:', data.length);
      setSucursales(data);
      
      if (refreshing) {
        enqueueSnackbar('Datos actualizados', { variant: 'info', autoHideDuration: 2000 });
      }
    } catch (error) {
      console.error('❌ Error cargando sucursales:', error);
      enqueueSnackbar('Error al cargar sucursales', { variant: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, refreshing, enqueueSnackbar]);

  useEffect(() => {
    cargarSucursales();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      enqueueSnackbar('El nombre es requerido', { variant: 'warning' });
      return;
    }
    if (!formData.telefono.trim()) {
      enqueueSnackbar('El teléfono es requerido', { variant: 'warning' });
      return;
    }
    if (!formData.direccion.trim()) {
      enqueueSnackbar('La dirección es requerida', { variant: 'warning' });
      return;
    }
    
    try {
      if (editando) {
        await api.put(`/sucursales/${editando.id}/`, formData);
        enqueueSnackbar('✅ Sucursal actualizada exitosamente', { variant: 'success' });
      } else {
        await api.post('/sucursales/', formData);
        enqueueSnackbar('✅ Sucursal creada exitosamente', { variant: 'success' });
      }
      
      await cargarSucursales();
      cerrarModal();
    } catch (error) {
      console.error('❌ Error guardando sucursal:', error);
      const errorMsg = error.response?.data?.error || 'Error al guardar sucursal';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar la sucursal "${nombre}"?\n\nEsto eliminará también todos los productos y ofertas asociados.`)) {
      return;
    }

    try {
      await api.delete(`/sucursales/${id}/`);
      enqueueSnackbar('Sucursal eliminada exitosamente', { variant: 'success' });
      await cargarSucursales();
    } catch (error) {
      console.error('❌ Error eliminando sucursal:', error);
      enqueueSnackbar('Error al eliminar sucursal', { variant: 'error' });
    }
  };

  const handleToggleActiva = async (sucursal) => {
    try {
      await api.patch(`/sucursales/${sucursal.id}/`, {
        activa: !sucursal.activa
      });
      enqueueSnackbar(
        `Sucursal ${!sucursal.activa ? 'activada' : 'desactivada'}`,
        { variant: 'success' }
      );
      await cargarSucursales();
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      enqueueSnackbar('Error al actualizar estado', { variant: 'error' });
    }
  };

  const abrirModalCrear = () => {
    setEditando(null);
    setFormData({
      nombre: '',
      telefono: '',
      direccion: '',
      activa: true
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (sucursal) => {
    setEditando(sucursal);
    setFormData({
      nombre: sucursal.nombre,
      telefono: sucursal.telefono,
      direccion: sucursal.direccion,
      activa: sucursal.activa
    });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditando(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <FaStore className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Gestión de Sucursales</h1>
            <p className="text-[#8D6E63]">{sucursales.length} sucursales registradas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarSucursales}
            disabled={refreshing}
            className={`p-3 rounded-xl border-2 border-gray-300 hover:border-purple-500 transition-all ${
              refreshing ? 'animate-spin' : ''
            }`}
            title="Actualizar datos"
          >
            <FaSync className="text-gray-600" />
          </button>
          <button
            onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <FaPlus />
            Nueva Sucursal
          </button>
        </div>
      </div>

      {/* Grid de Sucursales */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {sucursales.map((sucursal, index) => (
            <motion.div
              key={sucursal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all ${
                sucursal.activa 
                  ? 'border-purple-100 hover:border-purple-300' 
                  : 'border-gray-300 opacity-60'
              }`}
            >
              {/* Header con estado */}
              <div className={`p-4 ${
                sucursal.activa 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                  : 'bg-gray-400'
              }`}>
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <FaStore className="text-xl" />
                    <h3 className="text-xl font-bold">{sucursal.nombre}</h3>
                  </div>
                  <button
                    onClick={() => handleToggleActiva(sucursal)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      sucursal.activa
                        ? 'bg-white/20 hover:bg-white/30'
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    {sucursal.activa ? '✓ Activa' : '✗ Inactiva'}
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-5">
                {/* Información */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <FaPhone className="text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Teléfono</p>
                      <p className="font-semibold text-gray-800">{sucursal.telefono}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FaMapMarkerAlt className="text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Dirección</p>
                      <p className="text-sm text-gray-800">{sucursal.direccion}</p>
                    </div>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="bg-purple-50 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{sucursal.productos_count || 0}</p>
                      <p className="text-xs text-gray-600">Productos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{sucursal.ofertas_count || 0}</p>
                      <p className="text-xs text-gray-600">Ofertas</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{sucursal.usuarios_count || 0}</p>
                      <p className="text-xs text-gray-600">Admins</p>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModalEditar(sucursal)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <FaEdit />
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(sucursal.id, sucursal.nombre)}
                    className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {sucursales.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FaStore className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay sucursales registradas</p>
        </div>
      )}

      {/* Modal Crear/Editar */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={cerrarModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#5D4037]">
                    {editando ? 'Editar Sucursal' : 'Nueva Sucursal'}
                  </h2>
                  <button
                    onClick={cerrarModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Nombre de la Sucursal *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: Panadería Santa Clara No. 2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="text"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: 2222-2222"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Dirección *
                    </label>
                    <textarea
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Dirección completa de la sucursal"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      id="activa"
                      checked={formData.activa}
                      onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="activa" className="ml-2 block text-sm text-gray-900">
                      Sucursal activa
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSubmit}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
                    >
                      <FaCheck />
                      {editando ? 'Guardar Cambios' : 'Crear Sucursal'}
                    </button>
                    <button
                      onClick={cerrarModal}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}