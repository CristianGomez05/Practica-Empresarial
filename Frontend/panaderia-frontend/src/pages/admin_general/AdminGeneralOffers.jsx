// Frontend/src/pages/admin_general/AdminGeneralOffers.jsx
// ⭐⭐⭐ CORREGIDO: Recargar productos cuando cambia la sucursal en el modal

import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaTag, FaSave, FaTimes, FaEnvelope, FaExclamationTriangle, FaCheck, FaSync, FaMinus, FaInfoCircle, FaStore } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import useSmartRefresh from '../../hooks/useAutoRefresh';

export default function AdminGeneralOffers() {
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
  const [sucursalCambiada, setSucursalCambiada] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false); // ⭐ NUEVO

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    productos_data: [],
    precio_oferta: '',
    fecha_inicio: '',
    fecha_fin: '',
    sucursal: ''
  });

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true);

      const params = selectedBranch ? { sucursal: selectedBranch } : {};

      const [offersRes, productsRes, sucursalesRes] = await Promise.all([
        api.get('/ofertas/', { params }),
        api.get('/productos/', { params }),
        api.get('/sucursales/activas/')
      ]);

      setOffers(offersRes.data.results || offersRes.data);
      setProducts(productsRes.data.results || productsRes.data);
      setSucursales(sucursalesRes.data.results || sucursalesRes.data);

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
  }, [loading, refreshing, selectedBranch, enqueueSnackbar]);

  // ⭐⭐⭐ NUEVA FUNCIÓN: Cargar productos por sucursal específica
  const cargarProductosPorSucursal = useCallback(async (sucursalId) => {
    if (!sucursalId) {
      setProducts([]);
      return;
    }

    try {
      setLoadingProducts(true);
      console.log(`🔄 Cargando productos de sucursal ${sucursalId}...`);
      
      const response = await api.get('/productos/', {
        params: { sucursal: sucursalId }
      });
      
      const productosData = response.data.results || response.data;
      setProducts(productosData);
      
      console.log(`✅ Productos cargados: ${productosData.length}`);
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      enqueueSnackbar('Error al cargar productos de la sucursal', { variant: 'error' });
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [enqueueSnackbar]);

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
    setSucursalCambiada(false);

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
      }

      let sucursalParaEditar = offer.sucursal || '';
      if (currentUser?.rol === 'administrador' && currentUser?.sucursal_id) {
        sucursalParaEditar = currentUser.sucursal_id;
      }

      setFormData({
        titulo: offer.titulo,
        descripcion: offer.descripcion,
        productos_data: productosData,
        precio_oferta: offer.precio_oferta || '',
        fecha_inicio: formatDateForInput(offer.fecha_inicio),
        fecha_fin: formatDateForInput(offer.fecha_fin),
        sucursal: sucursalParaEditar
      });

      // ⭐ Cargar productos de la sucursal de la oferta al editar
      if (sucursalParaEditar) {
        cargarProductosPorSucursal(sucursalParaEditar);
      }
    } else {
      setEditingOffer(null);

      let sucursalDefault = '';
      if (currentUser?.rol === 'administrador' && currentUser?.sucursal_id) {
        sucursalDefault = currentUser.sucursal_id;
      } else if (currentUser?.rol === 'administrador_general' && selectedBranch) {
        sucursalDefault = selectedBranch;
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

      // ⭐ Cargar productos de la sucursal por defecto al crear
      if (sucursalDefault) {
        cargarProductosPorSucursal(sucursalDefault);
      } else {
        setProducts([]);
      }
    }
    setShowModal(true);
  };

  // ⭐⭐⭐ FUNCIÓN MEJORADA: Detectar cambio de sucursal Y recargar productos
  const handleSucursalChange = async (newSucursalId) => {
    const changed = editingOffer && editingOffer.sucursal !== parseInt(newSucursalId);
    setSucursalCambiada(changed);

    setFormData(prev => ({
      ...prev,
      sucursal: newSucursalId,
      // Si cambió la sucursal, limpiar productos seleccionados
      productos_data: changed ? [] : prev.productos_data
    }));

    // ⭐⭐⭐ CRÍTICO: Recargar productos de la nueva sucursal
    if (newSucursalId) {
      await cargarProductosPorSucursal(newSucursalId);
    } else {
      setProducts([]);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOffer(null);
    setSucursalCambiada(false);
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

    if (!formData.sucursal) {
      enqueueSnackbar('Debes seleccionar una sucursal', { variant: 'warning' });
      return;
    }

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
        sucursal: parseInt(formData.sucursal)
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
        || error.response?.data?.productos_data?.[0]
        || 'Error al guardar la oferta';

      enqueueSnackbar(errorMsg, { variant: 'error' });
    }
  };

  const handleDeleteClick = (offer) => {
    setOfferToDelete(offer);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!offerToDelete) return;

    try {
      await api.delete(`/ofertas/${offerToDelete.id}/`);
      enqueueSnackbar('Oferta eliminada', { variant: 'success' });
      await fetchData();
      setShowDeleteModal(false);
      setOfferToDelete(null);
    } catch (error) {
      console.error('Error eliminando oferta:', error);
      enqueueSnackbar('Error al eliminar la oferta', { variant: 'error' });
    }
  };

  // ⭐ FUNCIÓN: Obtener productos de la oferta
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
    }
    return [];
  };

  // ⭐ FUNCIÓN: Obtener estado de la oferta
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
      return { 
        text: 'Próxima', 
        bg: 'bg-blue-100', 
        textColor: 'text-blue-700',
        icon: <FaInfoCircle />
      };
    } else if (oferta.fecha_fin < hoy) {
      return { 
        text: 'Expirada', 
        bg: 'bg-gray-100', 
        textColor: 'text-gray-700',
        icon: <FaTimes />
      };
    } else {
      return { 
        text: 'Activa', 
        bg: 'bg-green-100', 
        textColor: 'text-green-700',
        icon: <FaCheck />
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
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <FaTag className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#5D4037]">Gestión de Ofertas</h1>
            <p className="text-[#8D6E63]">Crea y administra ofertas especiales</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className={`p-3 rounded-xl border-2 border-gray-300 hover:border-orange-500 transition-all ${refreshing ? 'animate-spin' : ''}`}
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
                      <FaStore className="text-purple-600" />
                      <span className="font-semibold">{offer.sucursal_nombre}</span>
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
                  {/* Selector de Sucursal */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Sucursal *
                    </label>

                    {currentUser?.rol === 'administrador' ? (
                      <div className="w-full px-4 py-3 border-2 border-purple-300 bg-purple-50 rounded-lg text-gray-700 font-semibold flex items-center gap-2">
                        <FaStore className="text-purple-600" />
                        <span>{currentUser?.sucursal_nombre || 'Sin asignar'}</span>
                        <span className="ml-auto text-xs bg-purple-600 text-white px-3 py-1 rounded-full">
                          Tu sucursal
                        </span>
                      </div>
                    ) : (
                      <>
                        <select
                          value={formData.sucursal}
                          onChange={(e) => handleSucursalChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      </>
                    )}

                    {/* ⭐ Advertencia cuando se cambia sucursal */}
                    {sucursalCambiada && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                        <FaExclamationTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-semibold">Sucursal cambiada</p>
                          <p>Los productos seleccionados se han limpiado. Selecciona productos de la nueva sucursal.</p>
                        </div>
                      </div>
                    )}

                    {currentUser?.rol === 'administrador' && (
                      <p className="text-xs text-purple-600 mt-1 font-semibold">
                        💡 Las ofertas se crearán automáticamente en tu sucursal asignada
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

                  {/* Selección de Productos */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-3">
                      Productos Incluidos en la Oferta *
                      <span className="text-xs text-gray-500 ml-2">(Selecciona y ajusta cantidades)</span>
                    </label>

                    {/* ⭐ Mostrar estado de carga */}
                    {loadingProducts ? (
                      <div className="flex justify-center items-center p-8 border-2 border-gray-200 rounded-lg bg-gray-50">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Cargando productos...</p>
                        </div>
                      </div>
                    ) : !formData.sucursal ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <FaInfoCircle className="text-blue-600 text-2xl mx-auto mb-2" />
                        <p className="text-blue-800">
                          Selecciona una sucursal primero para ver los productos disponibles
                        </p>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <p className="text-yellow-800">
                          ⚠️ No hay productos disponibles en esta sucursal.
                          <span className="block mt-2 text-sm">
                            Crea productos primero o selecciona otra sucursal.
                          </span>
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
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                agotado
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
                                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                                  agotado
                                    ? 'border-red-300 bg-red-100 cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-orange-600 border-orange-600'
                                    : 'border-gray-300 hover:border-orange-500'
                                }`}
                              >
                                {isSelected && <FaCheck className="text-white text-xs" />}
                              </button>

                              {/* Imagen del Producto */}
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                {product.imagen ? (
                                  <img
                                    src={product.imagen}
                                    alt={product.nombre}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FaTag className="text-2xl text-gray-300" />
                                  </div>
                                )}
                              </div>

                              {/* Info del Producto */}
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm truncate ${
                                  agotado ? 'text-red-700' : 'text-gray-800'
                                }`}>
                                  {product.nombre}
                                </p>
                                <p className="text-xs text-gray-600">
                                  ₡{Number(product.precio).toLocaleString('es-CR')}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-600">
                                    Stock: {product.stock}
                                  </span>
                                  {stockBajo && !agotado && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                      Bajo
                                    </span>
                                  )}
                                  {agotado && (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                      Agotado
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Control de Cantidad */}
                              {isSelected && !agotado && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => updateProductQuantity(product.id, cantidad - 1)}
                                    disabled={cantidad <= 1}
                                    className="w-6 h-6 rounded bg-orange-100 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                  >
                                    <FaMinus className="text-orange-600 text-xs" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={cantidad}
                                    onChange={(e) => updateProductQuantity(product.id, e.target.value)}
                                    className="w-12 text-center border border-gray-300 rounded py-1 text-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateProductQuantity(product.id, cantidad + 1)}
                                    className="w-6 h-6 rounded bg-orange-100 hover:bg-orange-200 flex items-center justify-center"
                                  >
                                    <FaPlus className="text-orange-600 text-xs" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Precio de Oferta */}
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">
                      Precio de la Oferta (₡) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.precio_oferta}
                      onChange={(e) => setFormData({ ...formData, precio_oferta: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="5000.00"
                    />
                  </div>

                  {/* Fechas */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#5D4037] mb-2">
                        Fecha Inicio *
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
                        Fecha Fin *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_fin}
                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <FaSave />
                      {editingOffer ? 'Actualizar' : 'Crear'} Oferta
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Eliminar */}
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
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <FaExclamationTriangle className="text-red-600 text-5xl mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#5D4037] mb-2">
                  ¿Eliminar oferta?
                </h3>
                <p className="text-gray-600 mb-6">
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
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