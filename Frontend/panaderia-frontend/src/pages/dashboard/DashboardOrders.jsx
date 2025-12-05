import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import ImageModal from "../../components/ImageModal";
import { 
  FaClipboardList, FaClock, FaCheckCircle, FaTruck, FaBox, 
  FaTag, FaPercentage, FaStore, FaMapMarkerAlt, FaTimes, FaBan 
} from "react-icons/fa";
import { useSnackbar } from 'notistack';

export default function DashboardOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [canceling, setCanceling] = useState(null); // ID del pedido que se está cancelando
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/pedidos/");
      const data = res.data.results || res.data;
      const sorted = data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setOrders(sorted);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      enqueueSnackbar("Error al cargar pedidos", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ⭐ NUEVA: Función para cancelar pedido
  const handleCancelarPedido = async (pedidoId) => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar este pedido?")) {
      return;
    }

    setCanceling(pedidoId);
    try {
      const res = await api.post(`/pedidos/${pedidoId}/cancelar/`);
      
      enqueueSnackbar("✅ Pedido cancelado exitosamente", { 
        variant: "success",
        autoHideDuration: 3000 
      });
      
      // Actualizar la lista de pedidos
      fetchOrders();
    } catch (error) {
      console.error("Error cancelando pedido:", error);
      
      const errorMsg = error.response?.data?.error || "No se pudo cancelar el pedido";
      enqueueSnackbar(`❌ ${errorMsg}`, { 
        variant: "error",
        autoHideDuration: 5000 
      });
    } finally {
      setCanceling(null);
    }
  };

  const openModal = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const getStatusInfo = (status) => {
    const statuses = {
      recibido: {
        label: "Recibido",
        icon: FaClock,
        color: "blue",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
      },
      en_preparacion: {
        label: "En Preparación",
        icon: FaBox,
        color: "yellow",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-700",
      },
      listo: {
        label: "Listo",
        icon: FaCheckCircle,
        color: "green",
        bgColor: "bg-green-100",
        textColor: "text-green-700",
      },
      entregado: {
        label: "Entregado",
        icon: FaTruck,
        color: "purple",
        bgColor: "bg-purple-100",
        textColor: "text-purple-700",
      },
      cancelado: {
        label: "Cancelado",
        icon: FaBan,
        color: "red",
        bgColor: "bg-red-100",
        textColor: "text-red-700",
      },
    };
    return statuses[status] || statuses.recibido;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const detectarOfertas = (order) => {
    if (!order.detalles || order.detalles.length === 0) return { tieneOferta: false };
    
    const totalEsperado = order.detalles.reduce((sum, item) => {
      return sum + (item.producto?.precio || 0) * item.cantidad;
    }, 0);
    
    const tieneOferta = order.total < totalEsperado - 1;
    const ahorro = tieneOferta ? totalEsperado - order.total : 0;
    const porcentajeDescuento = tieneOferta ? Math.round((ahorro / totalEsperado) * 100) : 0;
    
    return { tieneOferta, ahorro, porcentajeDescuento, totalEsperado };
  };

  const agruparPorSucursal = (detalles) => {
    if (!detalles || detalles.length === 0) return [];
    
    const grupos = {};
    
    detalles.forEach(detalle => {
      const sucursalNombre = detalle.sucursal_nombre || 'Sin sucursal';
      
      if (!grupos[sucursalNombre]) {
        grupos[sucursalNombre] = [];
      }
      
      grupos[sucursalNombre].push(detalle);
    });
    
    return Object.entries(grupos).map(([sucursal, productos]) => ({
      sucursal,
      productos
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaClipboardList className="text-5xl text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-[#5D4037] mb-3">
            No tienes pedidos aún
          </h2>
          <p className="text-[#8D6E63] mb-6">
            Realiza tu primer pedido y aparecerá aquí
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
          <FaClipboardList className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#5D4037]">Mis Pedidos</h1>
          <p className="text-[#8D6E63]">{orders.length} pedidos realizados</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order, index) => {
          const statusInfo = getStatusInfo(order.estado);
          const StatusIcon = statusInfo.icon;
          const { tieneOferta, ahorro, porcentajeDescuento, totalEsperado } = detectarOfertas(order);
          const gruposSucursal = agruparPorSucursal(order.detalles);
          const isCanceling = canceling === order.id;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl shadow-md border-2 overflow-hidden hover:shadow-lg transition-all ${
                order.estado === 'cancelado' 
                  ? 'border-red-200 bg-red-50 opacity-75'
                  : tieneOferta 
                  ? 'border-green-200 bg-gradient-to-br from-green-50 via-white to-white' 
                  : 'border-gray-100'
              }`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-2xl font-bold text-[#5D4037]">
                      Pedido #{order.id}
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}
                    >
                      <StatusIcon />
                      <span className="font-semibold text-sm">
                        {statusInfo.label}
                      </span>
                    </div>
                    {tieneOferta && order.estado !== 'cancelado' && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-600 text-white">
                        <FaTag className="text-xs" />
                        <span className="font-semibold text-sm">
                          Con Oferta
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                      order.es_domicilio 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {order.es_domicilio ? <FaTruck /> : <FaStore />}
                      <span className="font-semibold text-sm">
                        {order.tipo_entrega_display}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-[#8D6E63]">
                    <FaClock className="inline mr-2" />
                    {formatDate(order.fecha)}
                  </div>
                </div>

                {/* ⭐ NUEVO: Botón de cancelar (solo si puede_cancelarse) */}
                {order.puede_cancelarse && order.estado !== 'cancelado' && (
                  <div className="mb-4">
                    <button
                      onClick={() => handleCancelarPedido(order.id)}
                      disabled={isCanceling}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCanceling ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Cancelando...</span>
                        </>
                      ) : (
                        <>
                          <FaTimes />
                          <span>Cancelar Pedido</span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-600 mt-2">
                      ℹ️ Solo puedes cancelar pedidos que aún no han comenzado a prepararse
                    </p>
                  </div>
                )}

                {/* Mensaje si está cancelado */}
                {order.estado === 'cancelado' && (
                  <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FaBan className="text-red-600 text-lg mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-red-800 font-semibold text-sm mb-1">
                          ❌ Pedido cancelado
                        </p>
                        <p className="text-red-700 text-sm">
                          Este pedido fue cancelado y no será procesado.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Información de entrega */}
                {order.es_domicilio && order.direccion_entrega && order.estado !== 'cancelado' && (
                  <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FaMapMarkerAlt className="text-blue-600 text-lg mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-blue-800 font-semibold text-sm mb-1">
                          📍 Dirección de entrega:
                        </p>
                        <p className="text-blue-700 text-sm">
                          {order.direccion_entrega}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {order.es_recoger && order.estado !== 'cancelado' && (
                  <div className="mb-4 p-3 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FaStore className="text-purple-600 text-lg mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-purple-800 font-semibold text-sm mb-1">
                          🏪 Recoger en sucursal
                        </p>
                        <p className="text-purple-700 text-sm">
                          Por favor, pasar a recoger cuando esté listo
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Descuento Info */}
                {tieneOferta && order.estado !== 'cancelado' && (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <FaPercentage className="text-green-700" />
                        <span className="font-semibold text-green-800">
                          ¡Ahorraste ₡{ahorro.toFixed(2)} ({porcentajeDescuento}% OFF)!
                        </span>
                      </div>
                      <div className="text-sm text-green-700">
                        <span className="line-through">₡{totalEsperado.toFixed(2)}</span>
                        {' → '}
                        <span className="font-bold">₡{order.total}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items agrupados por sucursal */}
                {gruposSucursal.map((grupo, gIdx) => (
                  <div
                    key={gIdx}
                    className={`mb-4 rounded-lg p-4 border-2 ${
                      order.estado === 'cancelado'
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                    }`}
                  >
                    <div className={`flex items-center gap-2 mb-3 pb-3 border-b ${
                      order.estado === 'cancelado' ? 'border-gray-200' : 'border-amber-200'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        order.estado === 'cancelado' ? 'bg-gray-400' : 'bg-amber-500'
                      }`}>
                        <FaStore className="text-white text-sm" />
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${
                          order.estado === 'cancelado' ? 'text-gray-700' : 'text-amber-900'
                        }`}>
                          Sucursal: {grupo.sucursal}
                        </p>
                        <p className={`text-xs ${
                          order.estado === 'cancelado' ? 'text-gray-600' : 'text-amber-700'
                        }`}>
                          {grupo.productos.length} producto{grupo.productos.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {grupo.productos.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between py-2 border-b last:border-0 rounded-lg px-3 ${
                            order.estado === 'cancelado' 
                              ? 'bg-gray-100 border-gray-200'
                              : 'bg-white border-amber-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => order.estado !== 'cancelado' && openModal({
                                imagen: item.producto?.imagen,
                                nombre: item.producto?.nombre,
                                descripcion: item.producto?.descripcion,
                                precio: item.producto?.precio
                              })}
                              className={`w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 ${
                                order.estado !== 'cancelado' 
                                  ? 'cursor-pointer hover:ring-2 hover:ring-amber-400 transition-all transform hover:scale-105'
                                  : 'opacity-50'
                              }`}
                              title={order.estado !== 'cancelado' ? "Click para ver en grande" : ""}
                            >
                              <img
                                src={
                                  item.producto?.imagen ||
                                  "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=100&q=80"
                                }
                                alt={item.producto?.nombre}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className={`font-medium ${
                                order.estado === 'cancelado' ? 'text-gray-600' : 'text-[#5D4037]'
                              }`}>
                                {item.producto?.nombre || "Producto"}
                              </p>
                              <p className="text-sm text-[#8D6E63]">
                                Cantidad: {item.cantidad}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${
                              order.estado === 'cancelado' ? 'text-gray-600' : 'text-amber-700'
                            }`}>
                              ₡{((item.producto?.precio || 0) * item.cantidad).toFixed(2)}
                            </div>
                            {tieneOferta && order.estado !== 'cancelado' && (
                              <div className="text-xs text-green-600 font-medium">
                                Precio de oferta
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
                  <span className="text-lg font-semibold text-[#5D4037]">
                    Total {order.estado === 'cancelado' ? '(Cancelado)' : 'Pagado'}
                  </span>
                  <span className={`text-2xl font-bold ${
                    order.estado === 'cancelado' ? 'text-gray-600 line-through' : 'text-amber-700'
                  }`}>
                    ₡{order.total || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Image Modal */}
      {modalOpen && selectedProduct && (
        <ImageModal
          isOpen={modalOpen}
          onClose={closeModal}
          image={selectedProduct.imagen}
          title={selectedProduct.nombre}
          description={selectedProduct.descripcion}
          price={selectedProduct.precio}
        />
      )}
    </div>
  );
}