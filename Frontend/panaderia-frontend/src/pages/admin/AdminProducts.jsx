// Frontend/src/pages/admin/AdminProducts.jsx
import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBox, FaExclamationTriangle, FaUpload, FaImage, FaTimes, FaSync } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useSnackbar } from 'notistack';
import useSmartRefresh from '../../hooks/useAutoRefresh';

const AdminProducts = () => {
  const [productos, setProductos] = useState(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    disponible: true,
    imagen: ''
  });
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB');
      return;
    }

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }
    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }
    
    setSubiendoImagen(true);
    
    setTimeout(() => {
      if (editando) {
        setProductos(productos.map(p => 
          p.id === editando.id ? { ...p, ...formData, precio: parseFloat(formData.precio), stock: parseInt(formData.stock) } : p
        ));
        alert('✅ Producto actualizado exitosamente');
      } else {
        const nuevoProducto = {
          id: Date.now(),
          ...formData,
          precio: parseFloat(formData.precio),
          stock: parseInt(formData.stock),
          imagen: previewImagen || formData.imagen
        };
        setProductos([nuevoProducto, ...productos]);
        alert('✅ Producto creado exitosamente');
      }
      
      setSubiendoImagen(false);
      cerrarModal();
    }, 1000);
  };

  const handleEliminar = (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    setProductos(productos.filter(p => p.id !== id));
    alert('Producto eliminado exitosamente');
  };

  const abrirModalCrear = () => {
    setEditando(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      disponible: true,
      imagen: ''
    });
    setArchivoImagen(null);
    setPreviewImagen(null);
    setModalOpen(true);
  };

  const abrirModalEditar = (producto) => {
    setEditando(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      stock: producto.stock,
      disponible: producto.disponible,
      imagen: producto.imagen || ''
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <FaBox className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#5D4037]">Gestión de Productos</h1>
              <p className="text-[#8D6E63]">{productos.length} productos registrados</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRefreshing(true)}
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
              <FaPlus size={18} />
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
      </div>

      {/* Grid de Productos - Estilo Cards como Ofertas */}
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
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaBox className="text-6xl text-amber-300" />
                    </div>
                  )}
                  
                  {/* Badge de Estado */}
                  <div className={`absolute top-3 right-3 ${estado.bg} ${estado.textColor} px-3 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1`}>
                    {estado.icon}
                    <span>{estado.text}</span>
                  </div>

                  {/* Badge de Stock */}
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
                  {/* Alerta de Stock Agotado */}
                  {estaAgotado && (
                    <div className="mb-3 bg-red-100 border border-red-300 rounded-lg p-3 flex items-start gap-2">
                      <FaExclamationTriangle className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-800">
                        <p className="font-semibold">Producto agotado</p>
                        <p>Actualiza el inventario para volver a venderlo</p>
                      </div>
                    </div>
                  )}

                  {/* Alerta de Stock Bajo */}
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

                  {/* Información de Precio */}
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

                  {/* Información Adicional */}
                  <div className="text-sm text-[#8D6E63] mb-4 space-y-1">
                    <p className="flex justify-between">
                      <span>ID:</span>
                      <span className="font-semibold">#{producto.id}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Disponibilidad:</span>
                      <span className={`font-semibold ${producto.disponible ? 'text-green-600' : 'text-gray-600'}`}>
                        {producto.disponible ? 'Sí' : 'No'}
                      </span>
                    </p>
                  </div>

                  {/* Acciones */}
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
          <p className="text-gray-500">No hay productos registrados</p>
        </div>
      )}

      {/* Modal de Crear/Editar */}
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
              <div className="p-8">
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
                
                <div className="space-y-4">
                  {/* Sección de Imagen */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Ej: Croissant Francés"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Describe el producto..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio (₡) *
                      </label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={formData.precio}
                        onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="2500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock (unidades) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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

                  <div className="flex gap-3 mt-6 pt-4 border-t">
                    <button
                      onClick={cerrarModal}
                      disabled={subiendoImagen}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={subiendoImagen}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {subiendoImagen ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Guardando...
                        </>
                      ) : (
                        editando ? 'Actualizar Producto' : 'Crear Producto'
                      )}
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