// src/pages/admin/AdminProducts.jsx
import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBox, FaExclamationTriangle, FaUpload, FaImage, FaTimes } from 'react-icons/fa';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const AdminProducts = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await api.get('/productos/');
      const data = response.data.results || response.data;
      console.log('📦 Productos cargados:', data);
      setProductos(data);
    } catch (error) {
      enqueueSnackbar('Error al cargar productos', { variant: 'error' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Por favor selecciona un archivo de imagen válido', { variant: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('La imagen no debe superar los 5MB', { variant: 'error' });
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
    // ⭐ Si estamos editando, mantener la URL de la imagen existente
    if (!editando) {
      setFormData({ ...formData, imagen: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
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
    
    try {
      setSubiendoImagen(true);

      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre.trim());
      formDataToSend.append('descripcion', formData.descripcion.trim() || '');
      formDataToSend.append('precio', parseFloat(formData.precio));
      formDataToSend.append('stock', parseInt(formData.stock) || 0);
      formDataToSend.append('disponible', formData.disponible);

      // ⭐ SOLO agregar imagen si hay archivo nuevo
      if (archivoImagen) {
        console.log('📸 Subiendo nueva imagen:', archivoImagen.name);
        formDataToSend.append('imagen', archivoImagen);
      }
      // Si estamos editando y NO hay nueva imagen, Django mantendrá la existente

      // Log para debug
      console.log('📤 Enviando datos:', {
        nombre: formData.nombre,
        precio: formData.precio,
        stock: formData.stock,
        tiene_nueva_imagen: !!archivoImagen,
        editando: !!editando
      });

      if (editando) {
        console.log('🔄 Actualizando producto ID:', editando.id);
        const response = await api.put(`/productos/${editando.id}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('✅ Respuesta del servidor:', response.data);
        enqueueSnackbar('✅ Producto actualizado exitosamente', { variant: 'success' });
      } else {
        console.log('➕ Creando nuevo producto');
        const response = await api.post('/productos/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('✅ Respuesta del servidor:', response.data);
        enqueueSnackbar('✅ Producto creado y notificación enviada', { 
          variant: 'success',
          autoHideDuration: 4000 
        });
      }

      // ⭐ IMPORTANTE: Recargar productos después de guardar
      await cargarProductos();
      cerrarModal();
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Response:', error.response?.data);
      
      const errorMsg = error.response?.data?.error 
        || error.response?.data?.detail
        || error.response?.data?.imagen?.[0]
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
      enqueueSnackbar('Producto eliminado', { variant: 'success' });
      cargarProductos();
    } catch (error) {
      enqueueSnackbar('Error al eliminar producto', { variant: 'error' });
      console.error(error);
    }
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
    console.log('📝 Editando producto:', producto);
    setEditando(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      stock: producto.stock,
      disponible: producto.disponible,
      imagen: producto.imagen || '' // ⭐ Guardar URL de imagen existente
    });
    setArchivoImagen(null); // ⭐ No hay archivo nuevo
    setPreviewImagen(producto.imagen || null); // ⭐ Mostrar imagen existente
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditando(null);
    setArchivoImagen(null);
    setPreviewImagen(null);
  };

  // Estadísticas
  const stats = {
    total: productos.length,
    disponibles: productos.filter(p => p.stock > 0).length,
    agotados: productos.filter(p => p.stock === 0).length,
    stockBajo: productos.filter(p => p.stock > 0 && p.stock <= 5).length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Gestión de Productos</h1>
            <p className="text-[#8D6E63] mt-1">{productos.length} productos en total</p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg transition-colors shadow-md"
          >
            <FaPlus size={18} />
            Nuevo Producto
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <FaBox className="text-blue-600 text-2xl" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <FaBox className="text-green-600 text-2xl" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.disponibles}</p>
                <p className="text-sm text-gray-600">Disponibles</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="text-orange-600 text-2xl" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.stockBajo}</p>
                <p className="text-sm text-gray-600">Stock Bajo</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="text-red-600 text-2xl" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.agotados}</p>
                <p className="text-sm text-gray-600">Agotados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productos.map((producto) => {
              const estaAgotado = producto.stock === 0;
              const stockBajo = producto.stock > 0 && producto.stock <= 5;

              return (
                <tr key={producto.id} className={estaAgotado ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={producto.imagen || 'https://via.placeholder.com/50?text=Sin+Imagen'}
                        alt={producto.nombre}
                        className="h-10 w-10 rounded-lg object-cover"
                        onError={(e) => {
                          console.error('❌ Error cargando imagen:', producto.imagen);
                          e.target.src = 'https://via.placeholder.com/50?text=Error';
                        }}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {producto.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {producto.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ₡{producto.precio?.toLocaleString() || producto.precio}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {estaAgotado ? (
                        <span className="flex items-center gap-2 text-red-600 font-semibold">
                          <FaExclamationTriangle size={16} />
                          Agotado
                        </span>
                      ) : stockBajo ? (
                        <span className="flex items-center gap-2 text-orange-600 font-semibold">
                          <FaBox size={16} />
                          {producto.stock} unidades
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-green-600 font-semibold">
                          <FaBox size={16} />
                          {producto.stock} unidades
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {estaAgotado ? (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Sin Stock
                      </span>
                    ) : producto.disponible ? (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Disponible
                      </span>
                    ) : (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        No disponible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => abrirModalEditar(producto)}
                      className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded mr-2 transition-colors"
                      title="Editar"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleEliminar(producto.id)}
                      className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded transition-colors"
                      title="Eliminar"
                    >
                      <FaTrash size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {productos.length === 0 && (
          <div className="text-center py-12">
            <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay productos registrados</p>
          </div>
        )}
      </div>

      {/* Modal de Crear/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#5D4037] mb-6">
              {editando ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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
                      type="button"
                      onClick={eliminarImagen}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
                      title="Eliminar imagen"
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
                  rows="3"
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
                  type="button"
                  onClick={cerrarModal}
                  disabled={subiendoImagen}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={subiendoImagen}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;