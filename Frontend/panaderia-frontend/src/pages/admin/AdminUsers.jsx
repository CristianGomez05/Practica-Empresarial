// Frontend/src/pages/admin/AdminUsers.jsx
// VERSIÓN PARA ADMIN REGULAR - SOLO LECTURA

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FaUsers, FaSync, FaUserShield, FaUserTie, FaUser, FaEnvelope, FaStore, FaEye
} from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

export default function AdminUsers() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);
    console.log('👤 Usuario actual:', userData);
  }, []);

  const cargarDatos = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true);

      console.log('📡 Cargando usuarios...');

      const usuariosRes = await api.get('/usuarios/');
      const usuariosData = usuariosRes.data.results || usuariosRes.data;

      console.log('👥 Usuarios cargados:', usuariosData.length);

      setUsuarios(usuariosData);

      if (refreshing) {
        enqueueSnackbar('Datos actualizados', { variant: 'info', autoHideDuration: 2000 });
      }
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      const errorMsg = error.response?.data?.error ||
        error.response?.data?.detail ||
        'Error al cargar datos';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, refreshing, enqueueSnackbar]);

  useEffect(() => {
    cargarDatos();
  }, []);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <FaEye className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Usuarios Registrados</h1>
            <p className="text-[#8D6E63]">
              {usuarios.length} usuarios • Vista de solo lectura
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarDatos}
            disabled={refreshing}
            className={`p-3 rounded-xl border-2 border-gray-300 hover:border-blue-500 transition-all ${refreshing ? 'animate-spin' : ''}`}
            title="Actualizar datos"
          >
            <FaSync className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Alerta para Admin Regular */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <p className="text-blue-800 text-sm">
          👁️ <strong>Vista de Solo Lectura:</strong> Puedes ver la lista de usuarios, pero solo el Administrador General puede crear, editar o eliminar usuarios.
        </p>
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
                  {/* Usuario */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getRolIcon(usuario.rol)}
                      <div>
                        <p className="font-semibold text-gray-800">
                          {usuario.first_name && usuario.last_name
                            ? `${usuario.first_name} ${usuario.last_name}`
                            : usuario.username}
                        </p>
                        <p className="text-sm text-gray-500">@{usuario.username}</p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <FaEnvelope className="text-gray-400" />
                      <span className="text-sm">{usuario.email}</span>
                    </div>
                  </td>

                  {/* Rol */}
                  <td className="px-6 py-4">
                    {getRolBadge(usuario.rol)}
                  </td>

                  {/* Sucursal */}
                  <td className="px-6 py-4">
                    {usuario.sucursal_nombre ? (
                      <div className="flex items-center gap-2">
                        <FaStore className="text-purple-600" />
                        <span className="text-sm text-gray-700">{usuario.sucursal_nombre}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Sin asignar</span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      usuario.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.is_active ? '✓ Activo' : '✗ Inactivo'}
                    </span>
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
          <p className="text-gray-500 mb-2">No hay usuarios registrados</p>
        </div>
      )}
    </div>
  );
}