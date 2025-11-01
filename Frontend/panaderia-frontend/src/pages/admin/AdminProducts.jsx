// src/pages/admin/AdminProducts.jsx
import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBox, FaExclamationTriangle } from 'react-icons/fa';
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

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await api.get('/productos/');
      const data = response.data.results || response.data;
      setProductos(data);
    } catch (error) {
      enqueueSnackbar('Error al cargar productos', { variant: 'error' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const dataToSend = {
        ...formData,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock) || 0
      };

      if (editando) {
        await api.put(`/productos/${editando.id}/`, dataToSend);
        enqueueSnackbar('Producto actualizado exitosamente', { variant: 'success' });
      } else {
        await api.post('/productos/', dataToSend);
        enqueueSnackbar('Producto creado exitosamente', { variant: 'success' });
      }

      cargarProductos();
      cerrarModal();
    } catch (error) {
      enqueueSnackbar('Error al guardar producto', { variant: 'error' });
      console.error(error);
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
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditando(null);
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
                        src={producto.imagen || 'https://via.placeholder.com/50'}
                        alt={producto.nombre}
                        className="h-10 w-10 rounded-lg object-cover"
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
                          Agotado de momento
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
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#5D4037] mb-6">
              {editando ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de Imagen
                </label>
                <input
                  type="url"
                  value={formData.imagen}
                  onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                {formData.imagen && (
                  <div className="mt-2">
                    <img
                      src={formData.imagen}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
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
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shadow-md"
                >
                  {editando ? 'Actualizar' : 'Crear Producto'}
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