// Frontend/src/pages/admin/AdminOffersPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaTag, FaSave, FaTimes, FaEnvelope, FaExclamationTriangle, FaCheck, FaSync, FaMinus } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import useSmartRefresh from '../../hooks/useAutoRefresh';

export default function AdminOffersPanel() {
  // ⭐ NUEVO: Obtener sucursal seleccionada del contexto
  const { selectedBranch } = useOutletContext();

  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [editingOffer, setEditingOffer] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    productos_data: [],
    precio_oferta: '',
    fecha_inicio: '',
    fecha_fin: '',
    sucursal: '' // ⭐ NUEVO
  });

  const { enqueueSnackbar } = useSnackbar();

  // Cargar usuario actual
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);
  }, []);

  // ⭐ ACTUALIZADO: Cargar datos con filtro de sucursal
  const fetchData = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true);

      // ⭐ Aplicar filtro de sucursal si está seleccionada
      const params = selectedBranch ? { sucursal: selectedBranch } : {};

      const [offersRes, productsRes, sucursalesRes] = await Promise.all([
        api.get('/ofertas/', { params }),
        api.get('/productos/', { params }), // También filtrar productos por sucursal
        api.get('/sucursales/activas/')
      ]);

      setOffers(offersRes.data.results || offersRes.data);
      setProducts(productsRes.data.results || productsRes.data);
      setSucursales(sucursalesRes.data.results || sucursalesRes.data);

      console.log('🏷️ Ofertas cargadas:', offersRes.data.length, selectedBranch ? `(Sucursal: ${selectedBranch})` : '(Todas)');

      if (refreshing) {
        enqueueSnackbar('Datos actualizados', { variant: 'info', autoHideDuration: 2000 });
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      if (!loading) {
        enqueueSnackbar('Error al cargar datos', { variant: 'error' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, refreshing, selectedBranch, enqueueSnackbar]); // ⭐ Agregar selectedBranch

  // ⭐ Recargar cuando cambia la sucursal seleccionada
  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [selectedBranch]);

  useSmartRefresh(fetchData, {
    interval: 30000,
    enabled: !showModal && !showDeleteModal,
    refreshOnFocus: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpenModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);

      let productosData = [];
      if (offer.productos_data && Array.isArray(offer.productos_data)) {
        productosData = offer.productos_data;
      } else if (offer.productos_con_cantidad && Array.isArray(offer.productos_con_cantidad)) {
        productosData = offer.productos_con_cantidad.map(pc => ({
          producto_id: pc.producto.id,
          cantidad: pc.cantidad
        }));
      } else if (offer.productos_ids && Array.isArray(offer.productos_ids)) {
        productosData = offer.productos_ids.map(id => ({
          producto_id: id,
          cantidad: 1
        }));
      }

      setFormData({
        titulo: offer.titulo,
        descripcion: offer.descripcion,
        productos_data: productosData,
        precio_oferta: offer.precio_oferta || '',
        fecha_inicio: formatDateForInput(offer.fecha_inicio),
        fecha_fin: formatDateForInput(offer.fecha_fin),
        sucursal: offer.sucursal || '' // ⭐ NUEVO
      });
    } else {
      setEditingOffer(null);

      // ⭐ Auto-asignar sucursal según el usuario
      let sucursalDefault = '';
      if (currentUser?.rol === 'administrador' && currentUser?.sucursal_id) {
        sucursalDefault = currentUser.sucursal_id;
      }

      setFormData({
        titulo: '',
        descripcion: '',
        productos_data: [],
        precio_oferta: '',
        fecha_inicio: '',
        fecha_fin: '',
        sucursal: sucursalDefault
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOffer(null);
  };

  const toggleProductSelection = (productId) => {
    setFormData(prev => {
      const exists = prev.productos_data.find(p => p.producto_id === productId);

      if (exists) {
        return {
          ...prev,
          productos_data: prev.productos_data.filter(p => p.producto_id !== productId)
        };
      } else {
        return {
          ...prev,
          productos_data: [...prev.productos_data, { producto_id: productId, cantidad: 1 }]
        };
      }
    });
  };

  const updateProductQuantity = (productId, cantidad) => {
    const cantidadNum = parseInt(cantidad) || 1;
    if (cantidadNum < 1) return;

    setFormData(prev => ({
      ...prev,
      productos_data: prev.productos_data.map(p =>
        p.producto_id === productId
          ? { ...p, cantidad: cantidadNum }
          : p
      )
    }));
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.titulo.trim()) {
      enqueueSnackbar('El título es requerido', { variant: 'warning' });
      return;
    }
    if (!formData.descripcion.trim()) {
      enqueueSnackbar('La descripción es requerida', { variant: 'warning' });
      return;
    }
    if (formData.productos_data.length === 0) {
      enqueueSnackbar('Debes seleccionar al menos un producto', { variant: 'warning' });
      return;
    }

    // ⭐ Validar sucursal
    if (!formData.sucursal) {
      enqueueSnackbar('Debes seleccionar una sucursal', { variant: 'warning' });
      return;
    }

    // Validar stock
    const productosIds = formData.productos_data.map(p => p.producto_id);
    const productosSeleccionados = products.filter(p => productosIds.includes(p.id));
    const productosAgotados = productosSeleccionados.filter(p => p.stock === 0);

    if (productosAgotados.length > 0) {
      enqueueSnackbar(
        `No puedes crear una oferta con productos agotados: ${productosAgotados.map(p => p.nombre).join(', ')}`,
        { variant: 'error', autoHideDuration: 5000 }
      );
      return;
    }

    if (!formData.precio_oferta) {
      enqueueSnackbar('El precio de la oferta es requerido', { variant: 'warning' });
      return;
    }
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      enqueueSnackbar('Las fechas son requeridas', { variant: 'warning' });
      return;
    }

    try {
      const payload = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        productos_data: formData.productos_data.map(p => ({
          producto_id: parseInt(p.producto_id),
          cantidad: parseInt(p.cantidad)
        })),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        precio_oferta: parseFloat(formData.precio_oferta),
        sucursal: parseInt(formData.sucursal) // ⭐ NUEVO
      };

      console.log('📤 Enviando payload:', payload);

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

      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error guardando oferta:', error);
      console.error('Error response:', error.response?.data);

      const errorMsg = error.response?.data?.error
        || error.response?.data?.sucursal?.[0]
        || 'Error al guardar oferta';

      enqueueSnackbar(errorMsg, { variant: 'error' });
    }
  };

  const handleOpenDeleteModal = (offer) => {
    setOfferToDelete(offer);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!offerToDelete) return;

    try {
      await api.delete(`/ofertas/${offerToDelete.id}/`);
      enqueueSnackbar('Oferta eliminada exitosamente', { variant: 'success' });
      await fetchData();
      setShowDeleteModal(false);
      setOfferToDelete(null);
    } catch (error) {
      console.error('Error eliminando oferta:', error);
      enqueueSnackbar('Error al eliminar oferta', { variant: 'error' });
    }
  };

  const getEstadoOferta = (oferta) => {
    const hoy = new Date().toISOString().split('T')[0];
    const offerProducts = getOfferProducts(oferta);
    const tieneAgotados = offerProducts.some(p => p.stock === 0);

    if (tieneAgotados) {
      return {
        text: 'Productos Agotados',
        bg: 'bg-red-100',
        textColor: 'text-red-700',
        icon: <FaExclamationTriangle />
      };
    }

    if (oferta.fecha_inicio > hoy) {
      return { text: 'Próxima', bg: 'bg-blue-100', textColor: 'text-blue-700' };
    } else if (oferta.fecha_fin < hoy) {
      return { text: 'Expirada', bg: 'bg-gray-100', textColor: 'text-gray-700' };
    } else {
      return { text: 'Activa', bg: 'bg-green-100', textColor: 'text-green-700' };
    }
  };

  const getOfferProducts = (offer) => {
    if (offer.productos_con_cantidad && Array.isArray(offer.productos_con_cantidad)) {
      return offer.productos_con_cantidad.map(pc => ({
        ...pc.producto,
        cantidad_oferta: pc.cantidad
      }));
    } else if (offer.productos_data && Array.isArray(offer.productos_data)) {
      return offer.productos_data
        .map(pd => {
          const producto = products.find(p => p.id === pd.producto_id);
          return producto ? { ...producto, cantidad_oferta: pd.cantidad } : null;
        })
        .filter(Boolean);
    } else if (offer.productos_ids && Array.isArray(offer.productos_ids)) {
      return offer.productos_ids
        .map(prodId => {
          const producto = products.find(p => p.id === prodId);
          return producto ? { ...producto, cantidad_oferta: 1 } : null;
        })
        .filter(Boolean);
    }
    return [];
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
            <p className="text-[#8D6E63]">
              {offers.length} ofertas registradas
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
            onClick={fetchData}
            disabled={refreshing}
            className={`p-3 rounded-xl border-2 border-gray-300 hover:border-amber-500 transition-all ${refreshing ? 'animate-spin' : ''
              }`}
            title="Actualizar datos"
          >
            <FaSync className="text-gray-600" />
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <FaPlus />
            Nueva Oferta
          </button>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {offers.map((offer, index) => {
            const estado = getEstadoOferta(offer);
            const offerProducts = getOfferProducts(offer);
            const firstProduct = offerProducts[0];
            const productosAgotados = offerProducts.filter(p => p.stock === 0);
            const tieneAgotados = productosAgotados.length > 0;

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all ${tieneAgotados
                  ? 'border-red-300 bg-red-50'
                  : 'border-orange-100 hover:border-orange-300'
                  }`}
              >
                {/* Image */}
                <div className={`relative h-48 bg-gradient-to-br from-orange-100 to-red-100 ${tieneAgotados ? 'opacity-60' : ''
                  }`}>
                  {firstProduct?.imagen ? (
                    <img
                      src={firstProduct.imagen}
                      alt={offer.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaTag className="text-6xl text-orange-300" />
                    </div>
                  )}

                  <div className={`absolute top-3 right-3 ${estado.bg} ${estado.textColor} px-3 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1`}>
                    {estado.icon}
                    <span>{estado.text}</span>
                  </div>

                  {offerProducts.length > 1 && (
                    <div className="absolute top-3 left-3 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      {offerProducts.length} productos
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {tieneAgotados && (
                    <div className="mb-3 bg-red-100 border border-red-300 rounded-lg p-3 flex items-start gap-2">
                      <FaExclamationTriangle className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-800">
                        <p className="font-semibold">Productos agotados en esta oferta:</p>
                        <ul className="mt-1 space-y-1">
                          {productosAgotados.map((p, idx) => (
                            <li key={idx}>• {p.nombre}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-[#5D4037] mb-2">
                    {offer.titulo}
                  </h3>
                  <p className="text-sm text-[#8D6E63] mb-3 line-clamp-2">
                    {offer.descripcion}
                  </p>

                  {/* ⭐ Mostrar sucursal */}
                  {offer.sucursal_nombre && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-purple-600">
                      <span className="font-semibold">📍 {offer.sucursal_nombre}</span>
                    </div>
                  )}

                  {/* Products Info con CANTIDADES */}
                  <div className="bg-amber-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-[#8D6E63] mb-2">
                      {offerProducts.length > 1 ? 'Productos incluidos' : 'Producto'}
                    </p>

                    {offerProducts.length > 0 ? (
                      <div className="space-y-2">
                        {offerProducts.map((producto, idx) => {
                          const agotado = producto.stock === 0;
                          const stockBajo = producto.stock > 0 && producto.stock <= 5;
                          const cantidad = producto.cantidad_oferta || 1;

                          return (
                            <div key={idx} className={`flex justify-between items-center ${agotado ? 'opacity-60' : ''
                              }`}>
                              <div className="flex items-center gap-2">
                                {cantidad > 1 && (
                                  <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                    {cantidad}x
                                  </span>
                                )}
                                <p className="font-semibold text-[#5D4037] text-sm">
                                  {producto.nombre}
                                </p>
                                {agotado && (
                                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                    AGOTADO
                                  </span>
                                )}
                                {stockBajo && !agotado && (
                                  <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                                    Stock: {producto.stock}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                ₡{producto.precio}
                              </p>
                            </div>
                          );
                        })}
                        <div className="pt-2 mt-2 border-t border-amber-200">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold text-amber-800">
                              Precio Oferta:
                            </p>
                            <p className="text-lg font-bold text-amber-700">
                              ₡{offer.precio_oferta}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Sin productos</p>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="text-sm text-[#8D6E63] mb-4 space-y-1">
                    <p>Inicio: {new Date(offer.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                    <p>Fin: {new Date(offer.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                    {offer.dias_restantes > 0 && !tieneAgotados && (
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
                      onClick={() => handleOpenDeleteModal(offer)}
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

      {offers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FaTag className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {selectedBranch
              ? 'No hay ofertas en esta sucursal'
              : 'No hay ofertas registradas'
            }
          </p>
        </div>
      )}

      {/* Modal Crear/Editar */}
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
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
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

                <div className="space-y-6">
                  {/* ⭐ ACTUALIZADO: Selector de Sucursal */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Sucursal *
                      {currentUser?.rol === 'administrador' && (
                        <span className="text-xs text-gray-500 ml-2">(Tu sucursal - no editable)</span>
                      )}
                    </label>
                    <select
                      value={formData.sucursal}
                      onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      disabled={currentUser?.rol === 'administrador'} // ⭐ Bloqueado para admin regular
                    >
                      <option value="">Seleccionar sucursal...</option>
                      {sucursales.map((sucursal) => (
                        <option key={sucursal.id} value={sucursal.id}>
                          {sucursal.nombre}
                        </option>
                      ))}
                    </select>
                    {currentUser?.rol === 'administrador' && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Los productos se crean automáticamente en tu sucursal asignada
                      </p>
                    )}
                  </div>

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
                      placeholder="Ej: Combo Desayuno - 2 Panes + 1 Dona"
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
                    />
                  </div>

                  {/* Selección de Productos CON CANTIDADES */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-3">
                      Productos Incluidos en la Oferta *
                      <span className="text-xs text-gray-500 ml-2">(Selecciona y ajusta cantidades)</span>
                    </label>
                    {products.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <p className="text-yellow-800">
                          ⚠️ No hay productos disponibles en esta sucursal.
                          {currentUser?.rol === 'administrador_general' && (
                            <span className="block mt-2 text-sm">
                              Selecciona otra sucursal o crea productos primero.
                            </span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
                        {products.map(product => {
                          const productoData = formData.productos_data.find(p => p.producto_id === product.id);
                          const isSelected = !!productoData;
                          const cantidad = productoData?.cantidad || 1;
                          const agotado = product.stock === 0;
                          const stockBajo = product.stock > 0 && product.stock <= 5;

                          return (
                            <div
                              key={product.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${agotado
                                ? 'border-red-200 bg-red-50 opacity-50'
                                : isSelected
                                  ? 'border-orange-500 bg-orange-50 shadow-md'
                                  : 'border-gray-200 bg-white hover:border-orange-300'
                                }`}
                            >
                              {/* Checkbox */}
                              <button
                                type="button"
                                onClick={() => !agotado && toggleProductSelection(product.id)}
                                disabled={agotado}
                                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${agotado
                                  ? 'border-red-300 bg-red-100 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-orange-500 border-orange-500 cursor-pointer'
                                    : 'border-gray-300 cursor-pointer hover:border-orange-400'
                                  }`}
                              >
                                {isSelected && !agotado && <FaCheck className="text-white text-xs" />}
                                {agotado && <FaTimes className="text-red-600 text-xs" />}
                              </button>

                              {/* Info del Producto */}
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm truncate ${agotado
                                  ? 'text-red-600'
                                  : isSelected
                                    ? 'text-orange-900'
                                    : 'text-gray-800'
                                  }`}>
                                  {product.nombre}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs text-gray-500">
                                    ₡{product.precio}
                                  </p>
                                  {agotado ? (
                                    <span className="text-xs text-red-600 font-semibold">
                                      AGOTADO
                                    </span>
                                  ) : stockBajo ? (
                                    <span className="text-xs text-orange-600 font-semibold">
                                      Stock: {product.stock}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-green-600">
                                      Stock: {product.stock}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Selector de Cantidad */}
                              {isSelected && !agotado && (
                                <div className="flex items-center gap-2 bg-white rounded-lg border border-orange-300 px-2 py-1">
                                  <button
                                    type="button"
                                    onClick={() => updateProductQuantity(product.id, cantidad - 1)}
                                    disabled={cantidad <= 1}
                                    className={`w-6 h-6 flex items-center justify-center rounded ${cantidad <= 1
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                      }`}
                                  >
                                    <FaMinus className="text-xs" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={cantidad}
                                    onChange={(e) => updateProductQuantity(product.id, e.target.value)}
                                    className="w-12 text-center font-bold text-orange-700 bg-transparent focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateProductQuantity(product.id, cantidad + 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-orange-100 text-orange-600 hover:bg-orange-200"
                                  >
                                    <FaPlus className="text-xs" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <p className="text-gray-600">
                        ✓ {formData.productos_data.length} producto(s) seleccionado(s)
                      </p>
                      {formData.productos_data.length > 0 && (
                        <p className="text-purple-600 font-semibold">
                          Total items: {formData.productos_data.reduce((sum, p) => sum + p.cantidad, 0)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Precio de la Oferta */}
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Precio de la Oferta Completa (₡) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.precio_oferta}
                      onChange={(e) => setFormData({ ...formData, precio_oferta: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg font-semibold"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-amber-700 mt-2">
                      💡 Este será el precio total de la oferta que incluye todos los productos seleccionados con sus cantidades
                    </p>
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

      {/* Modal de Confirmación de Eliminación */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaExclamationTriangle className="text-red-600 text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  ¿Eliminar Oferta?
                </h3>
                <p className="text-gray-600 mb-6">
                  ¿Estás seguro de que deseas eliminar "<strong>{offerToDelete?.titulo}</strong>"?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}