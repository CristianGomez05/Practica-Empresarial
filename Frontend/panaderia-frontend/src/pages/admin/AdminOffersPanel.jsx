// Frontend/src/pages/admin/AdminOffersPanel.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaTag, FaSave, FaTimes, FaEnvelope } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

export default function AdminOffersPanel() {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    producto: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [offersRes, productsRes] = await Promise.all([
        api.get('/ofertas/'),
        api.get('/productos/')
      ]);
      setOffers(offersRes.data.results || offersRes.data);
      setProducts(productsRes.data.results || productsRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      enqueueSnackbar('Error al cargar datos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        titulo: offer.titulo,
        descripcion: offer.descripcion,
        producto: offer.producto.id,
        fecha_inicio: offer.fecha_inicio,
        fecha_fin: offer.fecha_fin
      });
    } else {
      setEditingOffer(null);
      setFormData({
        titulo: '',
        descripcion: '',
        producto: '',
        fecha_inicio: '',
        fecha_fin: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOffer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        producto_id: formData.producto
      };
      delete payload.producto;

      if (editingOffer) {
        await api.put(`/ofertas/${editingOffer.id}/`, payload);
        enqueueSnackbar('Oferta actualizada exitosamente', { variant: 'success' });
      } else {
        await api.post('/ofertas/', payload);
        enqueueSnackbar('✅ Oferta creada y correos enviados', { 
          variant: 'success',
          autoHideDuration: 4000 
        });
      }
      
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error guardando oferta:', error);
      enqueueSnackbar(error.response?.data?.error || 'Error al guardar oferta', { 
        variant: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta oferta?')) return;
    
    try {
      await api.delete(`/ofertas/${id}/`);
      enqueueSnackbar('Oferta eliminada', { variant: 'info' });
      fetchData();
    } catch (error) {
      console.error('Error eliminando oferta:', error);
      enqueueSnackbar('Error al eliminar oferta', { variant: 'error' });
    }
  };

  const getEstadoOferta = (oferta) => {
    const hoy = new Date().toISOString().split('T')[0];
    if (oferta.fecha_inicio > hoy) {
      return { 
        text: 'Próxima', 
        bg: 'bg-blue-100', 
        textColor: 'text-blue-700' 
      };
    } else if (oferta.fecha_fin < hoy) {
      return { 
        text: 'Expirada', 
        bg: 'bg-gray-100', 
        textColor: 'text-gray-700' 
      };
    } else {
      return { 
        text: 'Activa', 
        bg: 'bg-green-100', 
        textColor: 'text-green-700' 
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
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <FaTag className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Gestión de Ofertas</h1>
            <p className="text-[#8D6E63]">{offers.length} ofertas registradas</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
        >
          <FaPlus />
          Nueva Oferta
        </button>
      </div>

      {/* Offers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {offers.map((offer, index) => {
            const estado = getEstadoOferta(offer);
            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-orange-100 hover:border-orange-300 transition-all"
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100">
                  {offer.producto?.imagen ? (
                    <img
                      src={offer.producto.imagen}
                      alt={offer.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaTag className="text-6xl text-orange-300" />
                    </div>
                  )}
                  
                  {/* Estado Badge */}
                  <div className={`absolute top-3 right-3 ${estado.bg} ${estado.textColor} px-3 py-1 rounded-full text-sm font-semibold shadow-lg`}>
                    {estado.text}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-[#5D4037] mb-2">
                    {offer.titulo}
                  </h3>
                  <p className="text-sm text-[#8D6E63] mb-3 line-clamp-2">
                    {offer.descripcion}
                  </p>

                  {/* Product Info */}
                  <div className="bg-amber-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-[#8D6E63] mb-1">Producto</p>
                    <p className="font-semibold text-[#5D4037]">
                      {offer.producto?.nombre}
                    </p>
                    <p className="text-lg font-bold text-amber-700 mt-1">
                      ₡{offer.producto?.precio}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="text-sm text-[#8D6E63] mb-4 space-y-1">
                    <p>Inicio: {new Date(offer.fecha_inicio).toLocaleDateString('es-ES')}</p>
                    <p>Fin: {new Date(offer.fecha_fin).toLocaleDateString('es-ES')}</p>
                    {offer.dias_restantes > 0 && (
                      <p className="font-semibold text-orange-600">
                        {offer.dias_restantes} días restantes
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(offer)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <FaEdit />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(offer.id)}
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

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
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
                    {editingOffer ? 'Editar Oferta' : 'Nueva Oferta'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Título de la Oferta *
                    </label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ej: 2x1 en Croissants"
                      required
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Descripción *
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Describe los detalles de la oferta..."
                      rows="3"
                      required
                    />
                  </div>

                  {/* Producto */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Producto *
                    </label>
                    <select
                      value={formData.producto}
                      onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecciona un producto</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.nombre} - ₡{product.precio}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fechas */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#5D4037] mb-2">
                        Fecha de Inicio *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5D4037] mb-2">
                        Fecha de Fin *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_fin}
                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Info Box */}
                  {!editingOffer && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <FaEnvelope className="text-blue-600 text-xl flex-shrink-0 mt-1" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Notificación Automática</p>
                        <p>Al crear la oferta, se enviará un correo automático a todos los usuarios registrados.</p>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSubmit}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
                    >
                      <FaSave />
                      {editingOffer ? 'Guardar Cambios' : 'Crear Oferta'}
                    </button>
                    <button
                      onClick={handleCloseModal}
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