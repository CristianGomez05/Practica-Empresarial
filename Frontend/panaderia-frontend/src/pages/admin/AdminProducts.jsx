// Frontend/src/pages/admin/AdminProducts.jsx
import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaBox, FaExclamationTriangle, FaUpload, FaImage, FaTimes, FaSync, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useSnackbar } from 'notistack';
import useSmartRefresh from '../../hooks/useAutoRefresh';

const AdminProducts = () => {
  // ⭐ NUEVO: Obtener sucursal seleccionada del contexto
  const { selectedBranch } = useOutletContext();
  
  const [productos, setProductos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    disponible: true,
    imagen: '',
    sucursal: '' // ⭐ NUEVO
  });
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const { enqueueSnackbar } = useSnackbar();

  // Cargar usuario actual
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);
  }, []);

  // ⭐ ACTUALIZADO: Cargar productos con filtro de sucursal
  const cargarProductos = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true);
      
      // ⭐ Aplicar filtro de sucursal si está seleccionada
      const params = selectedBranch ? { sucursal: selectedBranch } : {};
      const response = await api.get('/productos/', { params });
      
      const data = response.data.results || response.data;
      console.log('📦 Productos cargados:', data.length, selectedBranch ? `(Sucursal: ${selectedBranch})` : '(Todas)');
      setProductos(data);
      
      if (refreshing) {
        enqueueSnackbar('Datos actualizados', { variant: 'info', autoHideDuration: 2000 });
      }
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      if (!loading) {
        enqueueSnackbar('Error al cargar productos', { variant: 'error' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, refreshing, selectedBranch, enqueueSnackbar]); // ⭐ Agregar selectedBranch

  // ⭐ NUEVO: Cargar sucursales
  const cargarSucursales = useCallback(async () => {
    try {
      const response = await api.get('/sucursales/activas/');
      const data = response.data.results || response.data;
      setSucursales(data);
    } catch (error) {
      console.error('❌ Error cargando sucursales:', error);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
    cargarSucursales();
  }, []);

  // ⭐ Recargar cuando cambia la sucursal seleccionada
  useEffect(() => {
    if (!loading) {
      cargarProductos();
    }
  }, [selectedBranch]);

  useSmartRefresh(cargarProductos, {
    interval: 30000,
    enabled: !modalOpen,
    refreshOnFocus: true
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Por favor selecciona una imagen válida (PNG, JPG, WEBP)', { variant: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('La imagen no debe superar 5MB', { variant: 'error' });
      return;
    }

    console.log('📷 Imagen seleccionada:', file.name, (file.size / 1024).toFixed(2), 'KB');
    
    setArchivoImagen(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImagen(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const eliminarImagen = () => {
    setArchivoImagen(null);
    setPreviewImagen(null);
    if (!editando) {
      setFormData({ ...formData, imagen: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      enqueueSnackbar('El nombre es requerido', { variant: 'warning' });
      return;
    }
    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      enqueueSnackbar('El precio debe ser mayor a 0', { variant: 'warning' });
      return;
    }
    if (formData.stock === '' || parseInt(formData.stock) < 0) {
      enqueueSnackbar('El stock no puede ser negativo', { variant: 'warning' });
      return;
    }
    
    // ⭐ Validar sucursal
    if (!formData.sucursal) {
      enqueueSnackbar('Debes seleccionar una sucursal', { variant: 'warning' });
      return;
    }
    
    try {
      setSubiendoImagen(true);

      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre.trim());
      formDataToSend.append('descripcion', formData.descripcion.trim() || '');
      formDataToSend.append('precio', parseFloat(formData.precio));
      formDataToSend.append('stock', parseInt(formData.stock) || 0);
      formDataToSend.append('disponible', formData.disponible);
      formDataToSend.append('sucursal', formData.sucursal); // ⭐ NUEVO

      if (archivoImagen) {
        console.log('📤 Subiendo imagen:', archivoImagen.name, (archivoImagen.size / 1024).toFixed(2), 'KB');
        formDataToSend.append('imagen', archivoImagen);
      }

      console.log('📤 Enviando datos:', {
        nombre: formData.nombre,
        precio: formData.precio,
        stock: formData.stock,
        sucursal: formData.sucursal,
        tiene_imagen_nueva: !!archivoImagen,
        editando: !!editando
      });

      let response;
      if (editando) {
        console.log('🔄 Actualizando producto ID:', editando.id);
        response = await api.put(`/productos/${editando.id}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('✅ Producto actualizado:', response.data);
        enqueueSnackbar('✅ Producto actualizado exitosamente', { variant: 'success' });
      } else {
        console.log('➕ Creando nuevo producto');
        response = await api.post('/productos/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('✅ Producto creado:', response.data);
        enqueueSnackbar('✅ Producto creado y notificación enviada a clientes', { 
          variant: 'success',
          autoHideDuration: 4000 
        });
      }

      await cargarProductos();
      cerrarModal();
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Response data:', error.response?.data);
      
      const errorMsg = error.response?.data?.error 
        || error.response?.data?.detail
        || error.response?.data?.imagen?.[0]
        || error.response?.data?.sucursal?.[0]
        || 'Error al guardar producto';
      
      enqueueSnackbar(errorMsg, { variant: 'error', autoHideDuration: 5000 });
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await api.delete(`/productos/${id}/`);
      enqueueSnackbar('Producto eliminado exitosamente', { variant: 'success' });
      await cargarProductos();
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      enqueueSnackbar('Error al eliminar producto', { variant: 'error' });
    }
  };

  const abrirModalCrear = () => {
    setEditando(null);
    
    // ⭐ Auto-asignar sucursal según el usuario
    let sucursalDefault = '';
    if (currentUser?.rol === 'administrador' && currentUser?.sucursal_id) {
      // Admin regular: su sucursal
      sucursalDefault = currentUser.sucursal_id;
    } else if (currentUser?.rol === 'administrador_general' && selectedBranch) {
      // Admin general: la sucursal seleccionada
      sucursalDefault = selectedBranch;
    }
    
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      disponible: true,
      imagen: '',
      sucursal: sucursalDefault
    });
    setArchivoImagen(null);
    setPreviewImagen(null);
    setModalOpen(true);
  };

  const abrirModalEditar = (producto) => {
    console.log('📝 Editando producto:', producto);
    setEditando(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      stock: producto.stock,
      disponible: producto.disponible,
      imagen: producto.imagen || '',
      sucursal: producto.sucursal || '' // ⭐ NUEVO
    });
    setArchivoImagen(null);
    setPreviewImagen(producto.imagen || null);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditando(null);
    setArchivoImagen(null);
    setPreviewImagen(null);
  };

  const stats = {
    total: productos.length,
    disponibles: productos.filter(p => p.stock > 0).length,
    agotados: productos.filter(p => p.stock === 0).length,
    stockBajo: productos.filter(p => p.stock > 0 && p.stock <= 5).length,
  };

  const getEstadoProducto = (producto) => {
    if (producto.stock === 0) {
      return { 
        text: 'Agotado', 
        bg: 'bg-red-100', 
        textColor: 'text-red-700',
        icon: <FaExclamationTriangle />
      };
    } else if (producto.stock <= 5) {
      return { 
        text: 'Stock Bajo', 
        bg: 'bg-orange-100', 
        textColor: 'text-orange-700',
        icon: <FaExclamationTriangle />
      };
    } else if (producto.disponible) {
      return { 
        text: 'Disponible', 
        bg: 'bg-green-100', 
        textColor: 'text-green-700',
        icon: <FaCheck />
      };
    } else {
      return { 
        text: 'No Disponible', 
        bg: 'bg-gray-100', 
        textColor: 'text-gray-700' 
      };
    }
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
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <FaBox className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Gestión de Productos</h1>
            <p className="text-[#8D6E63]">
              {productos.length} productos registrados
              {/* ⭐ Mostrar filtro activo */}
              {selectedBranch && sucursales.length > 0 && (
                <span className="ml-2 text-purple-600 font-semibold">
                  • {sucursales.find(s => s.id === selectedBranch)?.nombre || 'Filtrado'}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarProductos}
            disabled={refreshing}
            className={`p-3 rounded-xl border-2 border-gray-300 hover:border-amber-500 transition-all ${
              refreshing ? 'animate-spin' : ''
            }`}
            title="Actualizar datos"
          >
            <FaSync className="text-gray-600" />
          </button>
          <button
            onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <FaPlus />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500"
        >
          <div className="flex items-center gap-3">
            <FaBox className="text-blue-600 text-2xl" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500"
        >
          <div className="flex items-center gap-3">
            <FaBox className="text-green-600 text-2xl" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.disponibles}</p>
              <p className="text-sm text-gray-600">Disponibles</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500"
        >
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-orange-600 text-2xl" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.stockBajo}</p>
              <p className="text-sm text-gray-600">Stock Bajo</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500"
        >
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-red-600 text-2xl" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.agotados}</p>
              <p className="text-sm text-gray-600">Agotados</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Grid de Productos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {productos.map((producto, index) => {
            const estado = getEstadoProducto(producto);
            const estaAgotado = producto.stock === 0;
            const stockBajo = producto.stock > 0 && producto.stock <= 5;

            return (
              <motion.div
                key={producto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all ${
                  estaAgotado 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-amber-100 hover:border-amber-300'
                }`}
              >
                {/* Imagen */}
                <div className={`relative h-48 bg-gradient-to-br from-amber-100 to-orange-100 ${
                  estaAgotado ? 'opacity-60' : ''
                }`}>
                  {producto.imagen ? (
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('❌ Error cargando imagen:', producto.imagen);
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESin Imagen%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaBox className="text-6xl text-amber-300" />
                    </div>
                  )}
                  
                  <div className={`absolute top-3 right-3 ${estado.bg} ${estado.textColor} px-3 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1`}>
                    {estado.icon}
                    <span>{estado.text}</span>
                  </div>

                  {!estaAgotado && (
                    <div className={`absolute top-3 left-3 ${
                      stockBajo ? 'bg-orange-500' : 'bg-green-500'
                    } text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg`}>
                      Stock: {producto.stock}
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-5">
                  {estaAgotado && (
                    <div className="mb-3 bg-red-100 border border-red-300 rounded-lg p-3 flex items-start gap-2">
                      <FaExclamationTriangle className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-800">
                        <p className="font-semibold">Producto agotado</p>
                        <p>Actualiza el inventario para volver a venderlo</p>
                      </div>
                    </div>
                  )}

                  {stockBajo && !estaAgotado && (
                    <div className="mb-3 bg-orange-50 border border-orange-300 rounded-lg p-3 flex items-start gap-2">
                      <FaExclamationTriangle className="text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-orange-800">
                        <p className="font-semibold">Stock bajo</p>
                        <p>Quedan solo {producto.stock} unidades</p>
                      </div>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-[#5D4037] mb-2">
                    {producto.nombre}
                  </h3>
                  <p className="text-sm text-[#8D6E63] mb-3 line-clamp-2">
                    {producto.descripcion || 'Sin descripción'}
                  </p>

                  <div className="bg-amber-50 rounded-lg p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-amber-800">
                        Precio:
                      </p>
                      <p className="text-2xl font-bold text-amber-700">
                        ₡{parseFloat(producto.precio).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-[#8D6E63] mb-4 space-y-1">
                    <p className="flex justify-between">
                      <span>ID:</span>
                      <span className="font-semibold">#{producto.id}</span>
                    </p>
                    {/* ⭐ NUEVO: Mostrar sucursal */}
                    {producto.sucursal_nombre && (
                      <p className="flex justify-between">
                        <span>Sucursal:</span>
                        <span className="font-semibold text-purple-600">{producto.sucursal_nombre}</span>
                      </p>
                    )}
                    <p className="flex justify-between">
                      <span>Disponibilidad:</span>
                      <span className={`font-semibold ${producto.disponible ? 'text-green-600' : 'text-gray-600'}`}>
                        {producto.disponible ? 'Sí' : 'No'}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirModalEditar(producto)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <FaEdit />
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(producto.id)}
                      className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg transition-colors"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {productos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {selectedBranch 
              ? 'No hay productos en esta sucursal' 
              : 'No hay productos registrados'
            }
          </p>
        </div>
      )}

      {/* Modal */}
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
                    {editando ? 'Editar Producto' : 'Nuevo Producto'}
                  </h2>
                  <button
                    onClick={cerrarModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* ⭐ NUEVO: Selector de Sucursal */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Sucursal * 
                      {currentUser?.rol === 'administrador' && (
                        <span className="text-xs text-gray-500 ml-2">(Tu sucursal)</span>
                      )}
                    </label>
                    <select
                      value={formData.sucursal}
                      onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      disabled={currentUser?.rol === 'administrador'} // Admin regular no puede cambiar
                    >
                      <option value="">Seleccionar sucursal...</option>
                      {sucursales.map((sucursal) => (
                        <option key={sucursal.id} value={sucursal.id}>
                          {sucursal.nombre}
                        </option>
                      ))}
                    </select>
                    {sucursales.length === 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        ⚠️ No hay sucursales activas. Crea una primero.
                      </p>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-dashed border-amber-300">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FaImage className="text-amber-600" />
                      Imagen del Producto
                    </label>
                    
                    {previewImagen ? (
                      <div className="relative">
                        <img
                          src={previewImagen}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg shadow-md"
                        />
                        <button
                          onClick={eliminarImagen}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
                        >
                          <FaTimes size={16} />
                        </button>
                        <div className="mt-3 text-center">
                          <label className="cursor-pointer inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <FaUpload />
                            Cambiar imagen
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-amber-400 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                        <FaUpload className="text-4xl text-amber-600 mb-2" />
                        <span className="text-sm text-gray-600 font-medium">
                          Click para subir imagen
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          PNG, JPG, WEBP (máx. 5MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Ej: Croissant Francés"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Describe el producto..."
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#5D4037] mb-2">
                        Precio (₡) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.precio}
                        onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="2500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#5D4037] mb-2">
                        Stock (unidades) *
                      </label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      id="disponible"
                      checked={formData.disponible}
                      onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                    />
                    <label htmlFor="disponible" className="ml-2 block text-sm text-gray-900">
                      Producto disponible para la venta
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={subiendoImagen}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {subiendoImagen ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Guardando...
                        </>
                      ) : (
                        editando ? 'Guardar Cambios' : 'Crear Producto'
                      )}
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
};

export default AdminProducts;