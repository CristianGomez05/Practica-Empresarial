// src/pages/dashboard/DashboardCart.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../hooks/useCart";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaTrash, FaMinus, FaPlus, FaCheckCircle } from "react-icons/fa";
import { useSnackbar } from "notistack";
import api from "../../services/api";

export default function DashboardCart() {
  const { items, updateQty, remove, clear, total } = useCart();
  const [loading, setLoading] = useState(false);
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

  const handleCreateOrder = async () => {
    if (items.length === 0) {
      enqueueSnackbar("El carrito está vacío", { variant: "warning" });
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          producto: item.id,
          cantidad: item.qty,
        })),
        total,
      };

      const res = await api.post("/pedidos/", orderData);
      
      enqueueSnackbar("¡Pedido creado exitosamente!", {
        variant: "success",
        autoHideDuration: 3000,
      });
      
      clear();
      
      // Redirigir a la página de pedidos
      setTimeout(() => {
        navigate("/dashboard/pedidos");
      }, 1000);
    } catch (error) {
      console.error("Error creando pedido:", error);
      enqueueSnackbar("Error al crear el pedido. Intenta nuevamente.", {
        variant: "error",
      });
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
            {items.length} {items.length === 1 ? "producto" : "productos"}
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
                className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={
                        item.imagen ||
                        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80"
                      }
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-[#5D4037] mb-1 truncate">
                      {item.nombre}
                    </h3>
                    <p className="text-sm text-[#8D6E63] mb-3 line-clamp-2">
                      {item.descripcion}
                    </p>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          disabled={item.qty <= 1}
                        >
                          <FaMinus className="text-xs" />
                        </button>
                        <span className="font-semibold text-[#5D4037] w-8 text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>

                      {/* Price & Remove */}
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-amber-700">
                          ₡{(item.precio * item.qty).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRemove(item)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Clear Cart Button */}
          <button
            onClick={clear}
            className="w-full py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            Vaciar Carrito
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 sticky top-4"
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
              onClick={handleCreateOrder}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle className="text-lg" />
                  <span>Realizar Pedido</span>
                </>
              )}
            </button>

            <p className="text-xs text-center text-[#8D6E63] mt-4">
              Al realizar el pedido, aceptas nuestros términos y condiciones
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}