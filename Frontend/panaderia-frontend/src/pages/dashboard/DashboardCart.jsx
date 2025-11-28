// src/pages/dashboard/DashboardCart.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../hooks/useCart";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaTrash, FaMinus, FaPlus, FaCheckCircle, FaTag, FaBox } from "react-icons/fa";
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
      console.log('🛒 CREANDO PEDIDO');
      console.log('📦 Items en carrito:', items);

      // ⭐ CORRECCIÓN: Usar las cantidades correctas de productos_con_cantidad
      const orderItems = items.flatMap((item) => {
        console.log('🔍 Procesando item:', item);

        if (item.isOffer) {
          console.log('   🎁 Es una OFERTA');

          // ⭐ NUEVO: Extraer productos con cantidades
          let productosConCantidad = [];

          // Si tiene productos_con_cantidad (formato nuevo)
          if (item.productos_con_cantidad && Array.isArray(item.productos_con_cantidad)) {
            console.log('   ✅ Usando productos_con_cantidad (formato nuevo)');
            productosConCantidad = item.productos_con_cantidad.map(pc => ({
              id: pc.producto.id,
              nombre: pc.producto.nombre,
              cantidad_unitaria: pc.cantidad, // ⭐ Cantidad por unidad de oferta
              precio: pc.producto.precio
            }));
          }
          // Si tiene productos (formato antiguo)
          else if (item.productos && Array.isArray(item.productos)) {
            console.log('   ⚠️ Usando productos (formato antiguo, cantidad = 1)');
            productosConCantidad = item.productos.map(p => ({
              id: p.id,
              nombre: p.nombre,
              cantidad_unitaria: p.cantidad_oferta || 1, // ⭐ Intentar leer cantidad_oferta
              precio: p.precio
            }));
          }

          if (productosConCantidad.length === 0) {
            console.error('   ❌ Oferta sin productos válidos');
            throw new Error('Oferta sin productos válidos');
          }

          console.log('   📦 Productos extraídos:', productosConCantidad);

          // ⭐ CRÍTICO: Multiplicar cantidad_unitaria por item.qty
          const precioOferta = parseFloat(item.precio);
          const numProductos = productosConCantidad.length;
          const precioPorProducto = precioOferta / numProductos;

          return productosConCantidad.map((producto) => {
            const cantidadTotal = producto.cantidad_unitaria * item.qty; // ⭐ MULTIPLICAR

            const itemData = {
              producto: producto.id,
              cantidad: cantidadTotal, // ⭐ USAR CANTIDAD CORRECTA
              precio_unitario: precioPorProducto,
              es_oferta: true,
              oferta_titulo: item.nombre
            };

            console.log(`   ➕ ${producto.nombre}: ${producto.cantidad_unitaria} x ${item.qty} = ${cantidadTotal} unidades`);
            console.log('      Item generado:', itemData);

            return itemData;
          });
        } else {
          // Producto individual
          const itemData = {
            producto: item.id,
            cantidad: item.qty,
            precio_unitario: parseFloat(item.precio),
            es_oferta: false
          };
          console.log('   ➕ Producto individual:', itemData);
          return [itemData];
        }
      });

      console.log('📋 Items preparados para enviar:', orderItems);
      console.log('💰 Total:', total);

      const body = {
        items: orderItems,
        total,
      };

      console.log('📤 Enviando al backend:', JSON.stringify(body, null, 2));

      const res = await api.post("/pedidos/", body);

      console.log('✅ Respuesta del servidor:', res.data);

      enqueueSnackbar("¡Pedido creado exitosamente!", {
        variant: "success",
        autoHideDuration: 3000,
      });

      clear();

      setTimeout(() => {
        navigate("/dashboard/pedidos");
      }, 1000);
    } catch (error) {
      console.error('❌ Error al crear pedido:', error);
      console.error('   Detalles:', error.response?.data);

      if (error.response?.data?.error) {
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
            {items.length} {items.length === 1 ? "item" : "items"}
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
                className={`bg-white rounded-xl shadow-md p-6 border-2 transition-all ${item.isOffer
                    ? 'border-green-200 bg-gradient-to-r from-green-50 to-white'
                    : 'border-gray-100 hover:shadow-lg'
                  }`}
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
                    {/* Badge si es oferta */}
                    {item.isOffer && (
                      <span className="inline-flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded-full mb-2">
                        <FaTag className="text-[10px]" />
                        OFERTA ESPECIAL
                      </span>
                    )}

                    <h3 className="font-semibold text-lg text-[#5D4037] mb-1">
                      {item.nombre}
                    </h3>

                    {item.descripcion && (
                      <p className="text-sm text-[#8D6E63] mb-3 line-clamp-2">
                        {item.descripcion}
                      </p>
                    )}

                    {/* Productos incluidos (solo para ofertas) */}
                    {item.isOffer && item.productos && (
                      <div className="bg-white rounded-lg p-3 mb-3 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FaBox className="text-green-600 text-sm" />
                          <span className="text-sm font-semibold text-gray-700">
                            Incluye {item.productos.length} producto{item.productos.length > 1 ? 's' : ''}:
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {item.productos.map((producto, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                              {producto.nombre}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
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