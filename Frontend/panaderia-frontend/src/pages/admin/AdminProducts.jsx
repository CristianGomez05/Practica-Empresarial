// Frontend/src/pages/admin/AdminProducts.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaBox, FaSave, FaTimes, FaImage } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    disponible: true,
    imagen: ''
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/productos/');
      setProducts(res.data.results || res.data);
    } catch (error) {
      console.error('Error cargando productos:', error);
      enqueueSnackbar('Error al cargar productos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        precio: product.precio,
        disponible: product.disponible,
        imagen: product.imagen || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        disponible: true,
        imagen: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await api.put(`/productos/${editingProduct.id}/`, formData);
        enqueueSnackbar('Producto actualizado exitosamente', { variant: 'success' });
      } else {
        await api.post('/productos/', formData);
        enqueueSnackbar('Producto creado exitosamente', { variant: 'success' });
      }
      
      fetchProducts();
      handleCloseModal();
    } catch (error) {
      console.error('Error guardando producto:', error);
      enqueueSnackbar('Error al guardar producto', { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      await api.delete(`/productos/${id}/`);
      enqueueSnackbar('Producto eliminado', { variant: 'info' });
      fetchProducts();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      enqueueSnackbar('Error al eliminar producto', { variant: 'error' });
    }
  };

  const toggleDisponibilidad = async (product) => {
    try {
      await api.patch(`/productos/${product.id}/`, {
        disponible: !product.disponible
      });
      enqueueSnackbar(
        `Producto ${!product.disponible ? 'activado' : 'desactivado'}`, 
        { variant: 'success' }
      );
      fetchProducts();
    } catch (error) {
      console.error('Error actualizando disponibilidad:', error);
      enqueueSnackbar('Error al actualizar disponibilidad', { variant: 'error' });
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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <FaBox className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Gestión de Productos</h1>
            <p className="text-[#8D6E63]">{products.length} productos registrados</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
        >
          <FaPlus />
          Nuevo Producto
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Producto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Descripción</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Precio</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <AnimatePresence>
                {products.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imagen || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100'}
                          alt={product.nombre}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{product.nombre}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.descripcion || 'Sin descripción'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-amber-700">
                        ₡{product.precio}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleDisponibilidad(product)}
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          product.disponible
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        } transition-colors`}
                      >
                        {product.disponible ? '✓ Disponible' : '✗ No disponible'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Ver código completo en implementación */}
    </div>
  );
}