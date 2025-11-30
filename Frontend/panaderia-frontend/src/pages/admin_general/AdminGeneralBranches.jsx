// Frontend/src/pages/admin_general/AdminGeneralBranches.jsx
// COMPLETO Y FUNCIONAL - Gestión de sucursales

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStore, FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaPhone, FaToggleOn, FaToggleOff, FaTimes, FaSave, FaSync, FaBox, FaTag, FaUserShield } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import useSmartRefresh from '../../hooks/useAutoRefresh';

export default function AdminGeneralBranches() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
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
      if (!loading) {
        enqueueSnackbar('Error al cargar sucursales', { variant: 'error' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, refreshing, enqueueSnackbar]);

  useEffect(() => {
    cargarSucursales();
  }, []);

  useSmartRefresh(cargarSucursales, {
    interval: 30000,
    enabled: !modalOpen,
    refreshOnFocus: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      enqueueSnackbar('El nombre es requerido', { variant: 'warning' });
      return;
    }
    if (!formData.direccion.trim()) {
      enqueueSnackbar('La dirección es requerida', { variant: 'warning' });
      return;
    }
    
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        direccion: formData.direccion.trim(),
        telefono: formData.telefono.trim() || '',
        activa: formData.activa
      };

      if (editando) {
        await api.put(`/sucursales/${editando.id}/`, payload);
        enqueueSnackbar('Sucursal actualizada exitosamente', { variant: 'success' });
      } else {
        await api.post('/sucursales/', payload);
        enqueueSnackbar('Sucursal creada exitosamente', { variant: 'success' });
      }

      await cargarSucursales();
      cerrarModal();
    } catch (error) {
      console.error('❌ Error guardando sucursal:', error);
      const errorMsg = error.response?.data?.error 
        || error.response?.data?.nombre?.[0]
        || 'Error al guardar sucursal';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta sucursal? Esta acción no se puede deshacer.')) return;

    try {
      await api.delete(`/sucursales/${id}/`);
      enqueueSnackbar('Sucursal eliminada exitosamente', { variant: 'success' });
      await cargarSucursales();
    } catch (error) {
      console.error('❌ Error eliminando sucursal:', error);
      const errorMsg = error.response?.data?.error || 'Error al eliminar sucursal';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    }
  };

  const handleToggleActiva = async (sucursal) => {
    try {
      await api.patch(`/sucursales/${sucursal.id}/`, { activa: !sucursal.activa });
      enqueueSnackbar(
        `Sucursal ${!sucursal.activa ? 'activada' : 'desactivada'} exitosamente`,
        { variant: 'success' }
      );
      await cargarSucursales();
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      enqueueSnackbar('Error al cambiar estado', { variant: 'error' });
    }
  };

  const abrirModalCrear = () => {
    setEditando(null);
    setFormData({
      nombre: '',
      direccion: '',
      telefono: '',
      activa: true
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (sucursal) => {
    console.log('📝 Editando sucursal:', sucursal);
    setEditando(sucursal);
    setFormData({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      activa: sucursal.activa
    });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditando(null);
  };

  const stats = {
    total: sucursales.length,
    activas: sucursales.filter(s => s.activa).length,
    inactivas: sucursales.filter(s => !s.activa).length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
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
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <FaPlus />
            Nueva Sucursal
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Activas</p>
          <p className="text-2xl font-bold text-gray-800">{stats.activas}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Inactivas</p>
          <p className="text-2xl font-bold text-gray-800">{stats.inactivas}</p>
        </div>
      </div>

      {/* Grid de Sucursales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {sucursales.map((sucursal) => (
            <motion.div
              key={sucursal.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all ${
                sucursal.activa 
                  ? 'border-purple-200 hover:border-purple-400' 
                  : 'border-gray-200 opacity-60'
              }`}
            >
              <div className={`p-6 ${sucursal.activa ? 'bg-gradient-to-br from-purple-50 to-pink-50' : 'bg-gray-50'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#5D4037] mb-2">
                      {sucursal.nombre}
                    </h3>
                    <div className="space-y-2 text-sm text-[#8D6E63]">
                      <div className="flex items-start gap-2">
                        <FaMapMarkerAlt className="text-red-600 flex-shrink-0 mt-1" />
                        <span>{sucursal.direccion || 'Sin dirección'}</span>
                      </div>
                      {sucursal.telefono && (
                        <div className="flex items-center gap-2">
                          <FaPhone className="text-green-600" />
                          <span>{sucursal.telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActiva(sucursal)}
                    className={`p-2 rounded-lg transition-colors ${
                      sucursal.activa
                        ? 'text-green-600 hover:bg-green-100'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={sucursal.activa ? 'Desactivar' : 'Activar'}
                  >
                    {sucursal.activa ? <FaToggleOn size={28} /> : <FaToggleOff size={28} />}
                  </button>
                </div>

                {/* Estado */}
                <div className="mb-4">
                  {sucursal.activa ? (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      <FaToggleOn />
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                      <FaToggleOff />
                      Inactiva
                    </span>
                  )}
                </div>

                {/* Estadísticas */}
                <div className="bg-white rounded-lg p-3 mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-amber-600">
                      <FaBox />
                      <span>Productos</span>
                    </div>
                    <span className="font-bold">{sucursal.total_productos || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-orange-600">
                      <FaTag />
                      <span>Ofertas</span>
                    </div>
                    <span className="font-bold">{sucursal.total_ofertas || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-purple-600">
                      <FaUserShield />
                      <span>Admins</span>
                    </div>
                    <span className="font-bold">{sucursal.total_admins || 0}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModalEditar(sucursal)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <FaEdit />
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(sucursal.id)}
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
          <button
            onClick={abrirModalCrear}
            className="mt-4 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <FaPlus />
            Crear Primera Sucursal
          </button>
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

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Nombre de la Sucursal *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: Sucursal Centro"
                    />
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Dirección *
                    </label>
                    <textarea
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Dirección completa de la sucursal..."
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: 2222-3333"
                    />
                  </div>

                  {/* Activa */}
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

                  {/* Info */}
                  {!editando && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                      <p className="font-semibold mb-1">💡 Información</p>
                      <p>Después de crear la sucursal, podrás asignar productos, ofertas y administradores a ella.</p>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
                    >
                      <FaSave />
                      {editando ? 'Guardar Cambios' : 'Crear Sucursal'}
                    </button>
                    <button
                      type="button"
                      onClick={cerrarModal}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}