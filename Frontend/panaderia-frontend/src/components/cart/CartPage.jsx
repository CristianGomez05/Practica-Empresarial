// src/components/cart/CartPage.jsx
// ✅ CORREGIDO: Formato correcto para crear pedidos
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "./CartContext";
import { useAuth } from "../auth/AuthContext";
import { FaTag, FaBox, FaTrash, FaShoppingCart, FaExclamationTriangle } from "react-icons/fa";
import { useSnackbar } from 'notistack';
import ConfirmarPedidoModal from '../modals/ConfirmarPedidoModal';
import DomicilioModal from '../modals/DomicilioModal';
import api from "../../services/api";

export default function CartPage() {
  const { items, updateQty, remove, clear, total, hasStockIssues } = useContext(CartContext);
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDomicilioModal, setShowDomicilioModal] = useState(false);

  // ✅ Función auxiliar para asegurar números
  const ensureNumber = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // ✅ Función segura para formatear precios
  const formatPrice = (price) => {
    const numPrice = ensureNumber(price);
    return numPrice.toFixed(2);
  };

  // ⭐ NUEVO: Iniciar proceso de pedido
  const handleIniciarPedido = () => {
    if (!items.length) return;

    if (hasStockIssues()) {
      setError("Hay productos sin stock o con cantidades no válidas. Por favor ajusta tu carrito.");
      return;
    }

    setShowConfirmModal(true);
  };

  // ⭐ CORREGIDO: Crear pedido con formato correcto
  const handleCreateOrder = async (tipoEntrega) => {
    setLoading(true);
    setError(null);
    
    console.log('\n' + '='.repeat(60));
    console.log('🛒 CREANDO PEDIDO');
    console.log('📦 Tipo de entrega:', tipoEntrega);
    console.log('📦 Items en carrito:', items);
    console.log('📍 Domicilio del usuario:', user?.domicilio || 'No configurado');
    console.log('='.repeat(60));
    
    try {
      // ⭐ CRÍTICO: Construir items en formato que el backend espera
      const orderItems = [];
      
      for (const item of items) {
        console.log('🔍 Procesando item:', item);
        
        if (item.isOffer) {
          console.log('   🎁 Es una OFERTA con', item.productos?.length, 'productos');
          
          if (!item.productos || item.productos.length === 0) {
            throw new Error(`Oferta "${item.nombre}" no tiene productos válidos`);
          }
          
          // ⭐ Para ofertas: agregar cada producto de la oferta
          for (const producto of item.productos) {
            const cantidadOferta = producto.cantidad_oferta || 1;
            
            orderItems.push({
              producto: producto.id,
              cantidad: item.qty * cantidadOferta, // ⭐ Cantidad total = qty de oferta * cantidad del producto en oferta
            });
            
            console.log(`   ➕ Producto de oferta: ${producto.nombre} (ID: ${producto.id}) x ${item.qty * cantidadOferta}`);
          }
        } else {
          // ⭐ Para productos individuales
          orderItems.push({
            producto: item.id,
            cantidad: item.qty,
          });
          
          console.log(`   ➕ Producto individual: ${item.nombre} (ID: ${item.id}) x ${item.qty}`);
        }
      }

      console.log('📋 Items preparados:', orderItems);
      console.log('💰 Total:', total);

      // ⭐ CRÍTICO: Formato exacto que espera el backend
      const body = {
        items: orderItems,
        tipo_entrega: tipoEntrega, // ⭐ NUEVO: Incluir tipo de entrega
      };
      
      console.log('📤 Enviando al backend:', JSON.stringify(body, null, 2));
      
      const res = await api.post("/pedidos/", body);
      
      console.log('✅ Respuesta del servidor:', res.data);
      
      enqueueSnackbar('✅ ¡Pedido creado exitosamente!', { 
        variant: 'success',
        autoHideDuration: 3000 
      });
      
      clear(); // Limpiar carrito
      setShowConfirmModal(false);
      
      // Redirigir a la página del pedido
      navigate(`/dashboard/pedidos`);
      
    } catch (err) {
      console.error('❌ Error al crear pedido:', err);
      console.error('   Detalles:', err.response?.data);
      
      // ⭐ Manejo específico de error de domicilio
      if (err.response?.data?.codigo === 'DOMICILIO_REQUERIDO') {
        setShowConfirmModal(false);
        setShowDomicilioModal(true);
        enqueueSnackbar('⚠️ Debes configurar tu domicilio primero', { 
          variant: 'warning',
          autoHideDuration: 4000 
        });
        return;
      }
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
        enqueueSnackbar(`❌ ${err.response.data.error}`, { 
          variant: 'error',
          autoHideDuration: 5000 
        });
      } else if (err.message) {
        setError(err.message);
        enqueueSnackbar(`❌ ${err.message}`, { 
          variant: 'error',
          autoHideDuration: 5000 
        });
      } else {
        setError("No se pudo crear el pedido. Intenta nuevamente.");
        enqueueSnackbar('❌ Error al crear el pedido', { 
          variant: 'error' 
        });
      }
      
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500">Agrega productos u ofertas para comenzar</p>
      </div>
    );
  }

  const cartHasIssues = hasStockIssues();

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold text-[#5D4037] mb-6">Mi Carrito</h1>

      {cartHasIssues && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3">
          <FaExclamationTriangle className="text-red-600 text-xl flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-red-800 mb-1">Problemas con el stock</h3>
            <p className="text-red-700 text-sm">
              Algunos productos están agotados o no hay suficiente stock. 
              Por favor, ajusta las cantidades o elimina los productos marcados.
            </p>
          </div>
        </div>
      )}

      {items.map((item) => {
        const estaAgotado = !item.isOffer && (item.stock === 0 || item.esta_agotado);
        const stockInsuficiente = !item.isOffer && item.qty > item.stock;
        const ofertaConProductosAgotados = item.isOffer && item.productos?.some(p => p.stock === 0);
        const tieneProblema = estaAgotado || stockInsuficiente || ofertaConProductosAgotados;

        const precioItem = ensureNumber(item.precio);

        return (
          <div
            key={item.id}
            className={`bg-white p-5 rounded-xl shadow-md border-2 transition-all ${
              tieneProblema
                ? 'border-red-400 bg-red-50'
                : item.isOffer 
                ? 'border-green-200 bg-gradient-to-r from-green-50 to-white' 
                : 'border-gray-200'
            }`}
          >
            {tieneProblema && (
              <div className="mb-3 bg-red-100 border border-red-300 rounded-lg p-3 flex items-start gap-2">
                <FaExclamationTriangle className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  {estaAgotado && (
                    <p className="font-semibold">
                      ⚠️ Este producto se ha AGOTADO. Por favor elimínalo del carrito.
                    </p>
                  )}
                  {stockInsuficiente && !estaAgotado && (
                    <p className="font-semibold">
                      ⚠️ Solo quedan {item.stock} unidades disponibles. Ajusta la cantidad.
                    </p>
                  )}
                  {ofertaConProductosAgotados && (
                    <p className="font-semibold">
                      ⚠️ Algunos productos de esta oferta están agotados.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              {item.imagen && (
                <div className={`w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 ${
                  tieneProblema ? 'opacity-50 grayscale' : ''
                }`}>
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {item.isOffer && (
                      <span className="inline-flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded-full mb-2">
                        <FaTag className="text-[10px]" />
                        OFERTA ESPECIAL
                      </span>
                    )}
                    {tieneProblema && (
                      <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full mb-2 ml-2">
                        <FaExclamationTriangle className="text-[10px]" />
                        AGOTADO
                      </span>
                    )}
                    <h3 className="font-bold text-lg text-[#5D4037]">
                      {item.nombre || item.title}
                    </h3>
                    {item.descripcion && (
                      <p className="text-sm text-gray-600 mt-1">{item.descripcion}</p>
                    )}
                  </div>
                </div>

                {!item.isOffer && (
                  <div className="mb-2">
                    {estaAgotado ? (
                      <p className="text-red-600 font-semibold text-sm">
                        ❌ Sin existencias
                      </p>
                    ) : (
                      <p className={`text-sm font-medium ${
                        item.stock <= 5 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        📦 Stock disponible: {item.stock} unidades
                        {stockInsuficiente && (
                          <span className="text-red-600 ml-2">
                            (¡Cantidad excedida!)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {item.isOffer && item.productos && (
                  <div className="bg-white rounded-lg p-3 mb-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaBox className="text-green-600 text-sm" />
                      <span className="text-sm font-semibold text-gray-700">
                        Incluye {item.productos.length} producto{item.productos.length > 1 ? 's' : ''}:
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {item.productos.map((producto, idx) => {
                        const cantidadOferta = producto.cantidad_oferta || 1;
                        return (
                          <li key={idx} className="text-sm text-gray-600 flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                              {cantidadOferta > 1 && (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                  {cantidadOferta}x
                                </span>
                              )}
                              {producto.nombre}
                            </div>
                            {producto.stock === 0 ? (
                              <span className="text-red-600 font-semibold text-xs">AGOTADO</span>
                            ) : producto.stock <= 5 ? (
                              <span className="text-orange-600 text-xs">Stock: {producto.stock}</span>
                            ) : (
                              <span className="text-green-600 text-xs">✓ Disponible</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Precio unitario: <span className="font-semibold text-[#5D4037]">₡{formatPrice(precioItem)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Cantidad:</label>
                      <input
                        type="number"
                        min="1"
                        max={!item.isOffer ? item.stock : undefined}
                        value={item.qty}
                        onChange={(e) => updateQty(item.id, Math.max(1, Number(e.target.value)))}
                        disabled={tieneProblema}
                        className={`w-16 border-2 rounded-lg px-2 py-1 text-center focus:outline-none ${
                          tieneProblema
                            ? 'border-red-300 bg-red-50 cursor-not-allowed'
                            : 'border-gray-300 focus:border-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Subtotal</div>
                      <div className="text-xl font-bold text-amber-700">
                        ₡{formatPrice(precioItem * item.qty)}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="bg-white p-6 rounded-xl shadow-md border-2 border-amber-200">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xl font-semibold text-[#5D4037]">Total:</span>
          <span className="text-3xl font-bold text-amber-700">₡{formatPrice(total)}</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleIniciarPedido}
            disabled={loading || cartHasIssues}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all ${
              loading || cartHasIssues
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white'
            }`}
          >
            {cartHasIssues
              ? "Ajusta el carrito para continuar"
              : "Continuar con el pedido"}
          </button>
          <button
            onClick={clear}
            className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 font-semibold transition-colors"
          >
            Vaciar carrito
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
      <ConfirmarPedidoModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleCreateOrder}
        user={user}
        total={total}
        itemsCount={items.reduce((sum, item) => sum + item.qty, 0)}
      />

      {/* Modal de domicilio */}
      <DomicilioModal
        isOpen={showDomicilioModal}
        onClose={() => setShowDomicilioModal(false)}
        onSuccess={() => {
          setShowDomicilioModal(false);
          setShowConfirmModal(true);
        }}
      />
    </div>
  );
}