// Frontend/src/pages/dashboard/DashboardCart.jsx
// ⭐ ACTUALIZADO: Incluye modal de confirmación con tipo de entrega

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../hooks/useCart";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/auth/AuthContext";
import { useBranch } from "../../contexts/BranchContext";
import { FaShoppingCart, FaTrash, FaMinus, FaPlus, FaCheckCircle, FaTag, FaBox } from "react-icons/fa";
import { useSnackbar } from "notistack";
import api from "../../services/api";
import ConfirmarPedidoModal from "../../components/modals/ConfirmarPedidoModal";
import DomicilioModal from "../../components/modals/DomicilioModal";

export default function DashboardCart() {
  const { items, updateQty, remove, clear, total } = useCart();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDomicilioModal, setShowDomicilioModal] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleUpdateQty = (id, newQty) => {
    if (newQty < 1) return;
    updateQty(id, newQty);
  };

  const handleRemove = (item) => {
    remove(item.id);
    enqueueSnackbar(`${item.nombre} eliminado del carrito`, {
      variant: "info",
      autoHideDuration: 2000,
    });
  };

  const handleDomicilioSuccess = () => {
    enqueueSnackbar("Domicilio guardado exitosamente", {
      variant: "success",
      autoHideDuration: 2000
    });
  };

  const handleClickCrearPedido = () => {
    if (items.length === 0) {
      enqueueSnackbar("El carrito está vacío", { variant: "warning" });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async (tipoEntrega) => {
    setLoading(true);
    try {
      console.log('🛒 CREANDO PEDIDO');
      console.log('📦 Tipo de entrega:', tipoEntrega);
      console.log('📦 Items en carrito:', items);
      console.log('📍 Domicilio del usuario:', user.domicilio);

      const orderItems = items.flatMap((item) => {
        console.log('🔍 Procesando item:', item);

        if (item.isOffer) {
          console.log('   🎁 Es una OFERTA');
          const productosConCantidad = item.productos_con_cantidad || item.productos || [];

          if (productosConCantidad.length === 0) {
            console.error('   ❌ Oferta sin productos');
            throw new Error('Oferta sin productos válidos');
          }

          const precioOferta = parseFloat(item.precio);
          const numProductos = productosConCantidad.length;
          const precioPorProducto = precioOferta / numProductos;

          return productosConCantidad.map((producto) => {
            const cantidadTotal = (producto.cantidad_unitaria || producto.cantidad || 1) * item.qty;

            return {
              producto: producto.id || producto.producto_id,
              cantidad: cantidadTotal,
              precio_unitario: precioPorProducto,
              es_oferta: true,
              oferta_titulo: item.nombre
            };
          });
        } else {
          return [{
            producto: item.id,
            cantidad: item.qty,
            precio_unitario: parseFloat(item.precio),
            es_oferta: false
          }];
        }
      });

      console.log('📋 Items preparados:', orderItems);
      console.log('💰 Total:', total);

      const body = {
        items: orderItems,
        total,
        tipo_entrega: tipoEntrega
      };

      console.log('📤 Enviando al backend:', JSON.stringify(body, null, 2));

      const res = await api.post("/pedidos/", body);

      console.log('✅ Respuesta del servidor:', res.data);

      enqueueSnackbar("¡Pedido creado exitosamente!", {
        variant: "success",
        autoHideDuration: 3000,
      });

      clear();
      setShowConfirmModal(false);

      setTimeout(() => {
        navigate("/dashboard/pedidos");
      }, 1000);
    } catch (error) {
      console.error('❌ Error al crear pedido:', error);
      console.error('   Detalles:', error.response?.data);

      if (error.response?.data?.codigo === 'DOMICILIO_REQUERIDO') {
        setShowConfirmModal(false);
        setShowDomicilioModal(true);
        enqueueSnackbar(error.response.data.error || error.response.data.domicilio, { variant: "warning" });
      } else if (error.response?.data?.error) {
        enqueueSnackbar(error.response.data.error, { variant: "error" });
      } else if (error.message) {
        enqueueSnackbar(error.message, { variant: "error" });
      } else {
        enqueueSnackbar("No se pudo crear el pedido. Intenta nuevamente.", { variant: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaShoppingCart className="text-5xl text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-[#5D4037] mb-3">
            Tu carrito está vacío
          </h2>
          <p className="text-[#8D6E63] mb-6">
            Agrega productos para realizar un pedido
          </p>
          <button
            onClick={() => navigate("/dashboard/productos")}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Explorar Productos
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
          <FaShoppingCart className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#5D4037]">Mi Carrito</h1>
          <p className="text-[#8D6E63]">
            {items.length} {items.length === 1 ? "item" : "items"} • Sucursal: {selectedBranch?.nombre || 'No seleccionada'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`bg-white rounded-xl shadow-md p-6 border-2 transition-all ${
                  item.isOffer
                    ? "border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50"
                    : "border-gray-200 hover:border-amber-200"
                }`}
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shadow-md">
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                          <FaBox className="text-3xl text-gray-400" />
                        </div>
                      )}
                    </div>
                    {item.isOffer && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <FaTag className="text-xs" />
                        OFERTA
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#5D4037] mb-1">
                        {item.nombre}
                      </h3>
                      {item.descripcion && (
                        <p className="text-sm text-[#8D6E63] mb-2 line-clamp-2">
                          {item.descripcion}
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-amber-700">
                          ₡{item.precio.toFixed(2)}
                        </span>
                        {item.isOffer && item.productos && (
                          <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full font-semibold">
                            {item.productos.length} productos incluidos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                          disabled={item.qty <= 1}
                          className="w-8 h-8 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-amber-500 hover:text-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaMinus className="text-sm" />
                        </motion.button>
                        <span className="font-bold text-[#5D4037] w-12 text-center">
                          {item.qty}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                          className="w-8 h-8 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-amber-500 hover:text-amber-600 transition-colors"
                        >
                          <FaPlus className="text-sm" />
                        </motion.button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Subtotal</div>
                          <div className="text-xl font-bold text-amber-700">
                            ₡{(item.precio * item.qty).toFixed(2)}
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemove(item)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-3 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <FaTrash className="text-lg" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-4"
          >
            <h2 className="text-xl font-bold text-[#5D4037] mb-6">
              Resumen del Pedido
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[#8D6E63]">
                <span>Subtotal</span>
                <span className="font-semibold">₡{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#8D6E63]">
                <span>Envío</span>
                <span className="font-semibold text-green-600">Gratis</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-[#5D4037]">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-amber-700">
                    ₡{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClickCrearPedido}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle className="text-lg" />
                  <span>Continuar</span>
                </>
              )}
            </button>

            <p className="text-xs text-center text-[#8D6E63] mt-4">
              Al realizar el pedido, aceptas nuestros términos y condiciones
            </p>
          </motion.div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      <ConfirmarPedidoModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmOrder}
        user={user}
        total={total}
        itemsCount={items.length}
      />

      {/* Modal de Domicilio */}
      <DomicilioModal
        isOpen={showDomicilioModal}
        onClose={() => setShowDomicilioModal(false)}
        onSuccess={handleDomicilioSuccess}
      />
    </div>
  );
}