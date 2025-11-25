// Frontend/src/pages/admin/AdminUsers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, FaUserPlus, FaEdit, FaTrash, FaSync, FaTimes, FaCheck,
  FaUserShield, FaUserTie, FaUser, FaEnvelope, FaStore
} from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

export default function AdminUsers() {
  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    rol: 'cliente',
    sucursal: '',
    is_active: true,
    password: '',
    password_confirm: ''
  });
  const { enqueueSnackbar } = useSnackbar();

  // Cargar usuario actual
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);
  }, []);

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true);
      
      const [usuariosRes, sucursalesRes] = await Promise.all([
        api.get('/usuarios/'),
        api.get('/sucursales/')
      ]);
      
      const usuariosData = usuariosRes.data.results || usuariosRes.data;
      const sucursalesData = sucursalesRes.data.results || sucursalesRes.data;
      
      console.log('👥 Usuarios cargados:', usuariosData.length);
      console.log('🏪 Sucursales cargadas:', sucursalesData.length);
      
      setUsuarios(usuariosData);
      setSucursales(sucursalesData);
      
      if (refreshing) {
        enqueueSnackbar('Datos actualizados', { variant: 'info', autoHideDuration: 2000 });
      }
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      enqueueSnackbar('Error al cargar datos', { variant: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, refreshing, enqueueSnackbar]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.username.trim()) {
      enqueueSnackbar('El nombre de usuario es requerido', { variant: 'warning' });
      return;
    }
    if (!formData.email.trim()) {
      enqueueSnackbar('El email es requerido', { variant: 'warning' });
      return;
    }
    
    // Validar que administradores tengan sucursal asignada
    if ((formData.rol === 'administrador' || formData.rol === 'administrador_general') && !formData.sucursal) {
      enqueueSnackbar('Los administradores deben tener una sucursal asignada', { variant: 'warning' });
      return;
    }
    
    // Validar contraseñas en creación
    if (!editando) {
      if (!formData.password) {
        enqueueSnackbar('La contraseña es requerida', { variant: 'warning' });
        return;
      }
      if (formData.password !== formData.password_confirm) {
        enqueueSnackbar('Las contraseñas no coinciden', { variant: 'warning' });
        return;
      }
      if (formData.password.length < 8) {
        enqueueSnackbar('La contraseña debe tener al menos 8 caracteres', { variant: 'warning' });
        return;
      }
    }
    
    try {
      const dataToSend = { ...formData };
      
      // Si es cliente, remover sucursal
      if (dataToSend.rol === 'cliente') {
        dataToSend.sucursal = null;
      }
      
      // Remover campos de contraseña si están vacíos en edición
      if (editando) {
        delete dataToSend.password;
        delete dataToSend.password_confirm;
      } else {
        delete dataToSend.password_confirm;
      }
      
      if (editando) {
        await api.put(`/usuarios/${editando.id}/`, dataToSend);
        enqueueSnackbar('✅ Usuario actualizado exitosamente', { variant: 'success' });
      } else {
        await api.post('/usuarios/', dataToSend);
        enqueueSnackbar('✅ Usuario creado exitosamente', { variant: 'success' });
      }
      
      await cargarDatos();
      cerrarModal();
    } catch (error) {
      console.error('❌ Error guardando usuario:', error);
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.username?.[0] ||
                      error.response?.data?.email?.[0] ||
                      'Error al guardar usuario';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    }
  };

  const handleEliminar = async (id, username) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${username}"?`)) {
      return;
    }

    try {
      await api.delete(`/usuarios/${id}/`);
      enqueueSnackbar('Usuario eliminado exitosamente', { variant: 'success' });
      await cargarDatos();
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      enqueueSnackbar('Error al eliminar usuario', { variant: 'error' });
    }
  };

  const handleToggleActive = async (usuario) => {
    try {
      await api.patch(`/usuarios/${usuario.id}/`, {
        is_active: !usuario.is_active
      });
      enqueueSnackbar(
        `Usuario ${!usuario.is_active ? 'activado' : 'desactivado'}`,
        { variant: 'success' }
      );
      await cargarDatos();
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      enqueueSnackbar('Error al actualizar estado', { variant: 'error' });
    }
  };

  const abrirModalCrear = () => {
    setEditando(null);
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      rol: 'cliente',
      sucursal: '',
      is_active: true,
      password: '',
      password_confirm: ''
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (usuario) => {
    setEditando(usuario);
    setFormData({
      username: usuario.username,
      email: usuario.email,
      first_name: usuario.first_name || '',
      last_name: usuario.last_name || '',
      rol: usuario.rol,
      sucursal: usuario.sucursal || '',
      is_active: usuario.is_active,
      password: '',
      password_confirm: ''
    });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditando(null);
  };

  const getRolIcon = (rol) => {
    switch (rol) {
      case 'administrador_general':
        return <FaUserShield className="text-purple-600" />;
      case 'administrador':
        return <FaUserTie className="text-blue-600" />;
      default:
        return <FaUser className="text-green-600" />;
    }
  };

  const getRolBadge = (rol) => {
    const configs = {
      'administrador_general': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Admin General' },
      'administrador': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Administrador' },
      'cliente': { bg: 'bg-green-100', text: 'text-green-800', label: 'Cliente' }
    };
    const config = configs[rol] || configs.cliente;
    return (
      <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-semibold`}>
        {config.label}
      </span>
    );
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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <FaUsers className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Gestión de Usuarios</h1>
            <p className="text-[#8D6E63]">{usuarios.length} usuarios registrados</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarDatos}
            disabled={refreshing}
            className={`p-3 rounded-xl border-2 border-gray-300 hover:border-blue-500 transition-all ${
              refreshing ? 'animate-spin' : ''
            }`}
            title="Actualizar datos"
          >
            <FaSync className="text-gray-600" />
          </button>
          <button
            onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <FaUserPlus />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Usuario</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Rol</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Sucursal</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <motion.tr
                  key={usuario.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {getRolIcon(usuario.rol)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{usuario.username}</p>
                        {(usuario.first_name || usuario.last_name) && (
                          <p className="text-sm text-gray-500">
                            {usuario.first_name} {usuario.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaEnvelope className="text-gray-400" />
                      {usuario.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRolBadge(usuario.rol)}
                  </td>
                  <td className="px-6 py-4">
                    {usuario.sucursal_nombre ? (
                      <div className="flex items-center gap-2">
                        <FaStore className="text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {usuario.sucursal_nombre}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(usuario)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        usuario.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {usuario.is_active ? '✓ Activo' : '✗ Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirModalEditar(usuario)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        title="Editar usuario"
                      >
                        <FaEdit />
                      </button>
                      {usuario.id !== currentUser?.id && (
                        <button
                          onClick={() => handleEliminar(usuario.id, usuario.username)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Eliminar usuario"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {usuarios.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay usuarios registrados</p>
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
                    {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
                  </h2>
                  <button
                    onClick={cerrarModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#5D4037] mb-2">
                        Nombre de Usuario *
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nombre de usuario"
                        disabled={editando} // No se puede cambiar username en edición
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#5D4037] mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#5D4037] mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nombre"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#5D4037] mb-2">
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Apellido"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#5D4037] mb-2">
                        Rol *
                      </label>
                      <select
                        value={formData.rol}
                        onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="cliente">Cliente</option>
                        <option value="administrador">Administrador</option>
                        {currentUser?.rol === 'administrador_general' && (
                          <option value="administrador_general">Administrador General</option>
                        )}
                      </select>
                    </div>

                    {(formData.rol === 'administrador' || formData.rol === 'administrador_general') && (
                      <div>
                        <label className="block text-sm font-medium text-[#5D4037] mb-2">
                          Sucursal *
                        </label>
                        <select
                          value={formData.sucursal}
                          onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Seleccionar sucursal...</option>
                          {sucursales.filter(s => s.activa).map((sucursal) => (
                            <option key={sucursal.id} value={sucursal.id}>
                              {sucursal.nombre}
                            </option>
                          ))}
                        </select>
                        {sucursales.length === 0 && (
                          <p className="text-sm text-amber-600 mt-1">
                            ⚠️ No hay sucursales activas. Crea una primero.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {!editando && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#5D4037] mb-2">
                          Contraseña *
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Mínimo 8 caracteres"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#5D4037] mb-2">
                          Confirmar Contraseña *
                        </label>
                        <input
                          type="password"
                          value={formData.password_confirm}
                          onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Repetir contraseña"
                        />
                      </div>
                    </div>
                  )}

                  {editando && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 Deja las contraseñas en blanco si no deseas cambiarlas
                      </p>
                    </div>
                  )}

                  <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Usuario activo
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
                    >
                      <FaCheck />
                      {editando ? 'Guardar Cambios' : 'Crear Usuario'}
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