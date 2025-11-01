// src/components/cart/CartPage.jsx
import React, { useContext, useState } from "react";
import { CartContext } from "./CartContext";
import { FaTag, FaBox, FaTrash, FaShoppingCart, FaExclamationTriangle } from "react-icons/fa";
import api from "../../services/api";

export default function CartPage() {
  const { items, updateQty, remove, clear, total, hasStockIssues } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateOrder = async () => {
    if (!items.length) return;

    // Verificar problemas de stock antes de crear el pedido
    if (hasStockIssues()) {
      setError("Hay productos sin stock o con cantidades no válidas. Por favor ajusta tu carrito.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Preparar items para el pedido
      const orderItems = items.flatMap((item) => {
        if (item.isOffer) {
          // Si es una oferta, añadir todos sus productos
          return item.productos.map((producto) => ({
            producto: producto.id,
            cantidad: item.qty,
            precio_unitario: item.precio / item.productos.length, // Distribuir precio
          }));
        } else {
          // Si es un producto individual
          return [{
            producto: item.id,
            cantidad: item.qty,
          }];
        }
      });

      const body = {
        items: orderItems,
        total,
      };
      
      const res = await api.post("/pedidos/", body);
      clear();
      window.location.href = `/dashboard/pedidos/${res.data.id}`;
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("No se pudo crear el pedido. Intenta nuevamente.");
      }
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

      {/* Alerta general de stock */}
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
        // Verificar problemas de stock
        const estaAgotado = !item.isOffer && (item.stock === 0 || item.esta_agotado);
        const stockInsuficiente = !item.isOffer && item.qty > item.stock;
        const ofertaConProductosAgotados = item.isOffer && item.productos?.some(p => p.stock === 0);
        const tieneProblema = estaAgotado || stockInsuficiente || ofertaConProductosAgotados;

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
            {/* Alerta de stock específica */}
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
              {/* Imagen */}
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

              {/* Contenido */}
              <div className="flex-1">
                {/* Header con badge */}
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

                {/* Stock disponible (solo productos) */}
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
                        <li key={idx} className="text-sm text-gray-600 flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
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
                      ))}
                    </ul>
                  </div>
                )}

                {/* Precio y controles */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Precio unitario: <span className="font-semibold text-[#5D4037]">₡{item.precio}</span>
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
                        ₡{(item.precio * item.qty).toFixed(2)}
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

      {/* Total y acciones */}
      <div className="bg-white p-6 rounded-xl shadow-md border-2 border-amber-200">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xl font-semibold text-[#5D4037]">Total:</span>
          <span className="text-3xl font-bold text-amber-700">₡{total.toFixed(2)}</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCreateOrder}
            disabled={loading || cartHasIssues}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all ${
              loading || cartHasIssues
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white'
            }`}
          >
            {loading 
              ? "Creando pedido..." 
              : cartHasIssues
              ? "Ajusta el carrito para continuar"
              : "Crear pedido"}
          </button>
          <button
            onClick={clear}
            className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 font-semibold transition-colors"
          >
            Vaciar carrito
          </button>
        </div>
      </div>
    </div>
  );
}