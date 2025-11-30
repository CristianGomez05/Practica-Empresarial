// Frontend/src/pages/admin_general/AdminGeneralProducts.jsx
// COMPLETO Y FUNCIONAL - Admin General CON selector activo

import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaBox, FaExclamationTriangle, FaUpload, FaImage, FaTimes, FaSync, FaCheck, FaStore } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useSnackbar } from 'notistack';
import useSmartRefresh from '../../hooks/useAutoRefresh';

const AdminGeneralProducts = () => {
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
    sucursal: ''
  });
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const cargarProductos = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true);
      
      const params = selectedBranch ? { sucursal: selectedBranch } : {};
      const response = await api.get('/productos/', { params });
      
      const data = response.data.results || response.data;
      console.log('📦 Productos cargados:', data.length);
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
  }, [loading, refreshing, selectedBranch, enqueueSnackbar]);

  const cargarSucursales = useCallback(async () => {
    try {
      const response = await api.get('/sucursales/activas/');
      const data = response.data.results || response.data;
      setSucursales(data);
      console.log('🏪 Sucursales cargadas:', data.length);
    } catch (error) {
      console.error('❌ Error cargando sucursales:', error);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
    cargarSucursales();
  }, []);

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

    console.log('📷 Imagen seleccionada:', file.name);
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
      formDataToSend.append('sucursal', formData.sucursal);

      if (archivoImagen) {
        console.log('📤 Subiendo imagen:', archivoImagen.name);
        formDataToSend.append('imagen', archivoImagen);
      }

      let response;
      if (editando) {
        console.log('🔄 Actualizando producto ID:', editando.id);
        response = await api.put(`/productos/${editando.id}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        enqueueSnackbar('✅ Producto actualizado exitosamente', { variant: 'success' });
      } else {
        console.log('➕ Creando nuevo producto');
        response = await api.post('/productos/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        enqueueSnackbar('✅ Producto creado exitosamente', { variant: 'success' });
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
      
      enqueueSnackbar(errorMsg, { variant: 'error' });
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
    
    // Para admin general, pre-seleccionar la sucursal del filtro si existe
    let sucursalDefault = selectedBranch || '';
    
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
      sucursal: producto.sucursal || ''
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Disponibles</p>
          <p className="text-2xl font-bold text-gray-800">{stats.disponibles}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Stock Bajo</p>
          <p className="text-2xl font-bold text-gray-800">{stats.stockBajo}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Agotados</p>
          <p className="text-2xl font-bold text-gray-800">{stats.agotados}</p>
        </div>
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {productos.map((producto) => {
            const estado = getEstadoProducto(producto);
            return (
              <motion.div
                key={producto.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 bg-gray-100">
                  {producto.imagen ? (
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaBox className="text-6xl text-gray-300" />
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 ${estado.bg} ${estado.textColor} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                    {estado.icon}
                    {estado.text}
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-lg text-gray-800 truncate">{producto.nombre}</h3>
                  
                  {producto.descripcion && (
                    <p className="text-sm text-gray-600 line-clamp-2">{producto.descripcion}</p>
                  )}

                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-[#5D4037]">
                      ₡{Number(producto.precio).toLocaleString('es-CR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Stock: <span className={`font-semibold ${producto.stock <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                        {producto.stock} unidades
                      </span>
                    </p>
                    {producto.sucursal_nombre && (
                      <p className="text-sm text-gray-600">
                        Sucursal: <span className="font-semibold text-purple-600">{producto.sucursal_nombre}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Disponible: <span className={`font-semibold ${producto.disponible ? 'text-green-600' : 'text-gray-600'}`}>
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

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Ej: Pan Francés"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Descripción del producto..."
                    />
                  </div>

                  {/* Selector de Sucursal - SIEMPRE ACTIVO para Admin General */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Sucursal *
                    </label>
                    <select
                      value={formData.sucursal}
                      onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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

                  {/* Precio y Stock */}
                  <div className="grid grid-cols-2 gap-4">
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
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5D4037] mb-2">
                        Stock *
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

                  {/* Imagen */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Imagen del Producto
                    </label>
                    <div className="space-y-3">
                      {(previewImagen || editando?.imagen) && (
                        <div className="relative">
                          <img
                            src={previewImagen || editando.imagen}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={eliminarImagen}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      )}
                      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-amber-500 transition-colors">
                        <FaUpload className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {archivoImagen ? archivoImagen.name : 'Seleccionar imagen'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Disponible */}
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

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
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
};

export default AdminGeneralProducts;