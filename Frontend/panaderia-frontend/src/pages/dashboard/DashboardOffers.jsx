// src/pages/dashboard/DashboardOffers.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { useCart } from "../../hooks/useCart";
import { FaShoppingCart, FaTag, FaClock, FaCheck, FaBox, FaExclamationTriangle } from "react-icons/fa";
import { useSnackbar } from "notistack";

export default function DashboardOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { add, addOffer } = useCart();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    async function fetchOffers() {
      try {
        const res = await api.get("/ofertas/");
        const data = res.data.results || res.data;
        
        // Filtrar ofertas activas con corrección de zona horaria
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Resetear a medianoche local
        
        const activeOffers = data.filter((offer) => {
          // ⭐ FIX: Agregar 'T00:00:00' para fechas locales
          const startDate = new Date(offer.fecha_inicio + 'T00:00:00');
          const endDate = new Date(offer.fecha_fin + 'T00:00:00');
          
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          
          return today >= startDate && today <= endDate;
        });
        
        console.log('📅 Ofertas activas:', activeOffers.length);
        setOffers(activeOffers);
      } catch (error) {
        console.error("Error cargando ofertas:", error);
        enqueueSnackbar("Error al cargar ofertas", { variant: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, [enqueueSnackbar]);

  const handleAddAllToCart = (offer) => {
    // ⭐ VALIDACIÓN: Verificar que todos los productos tengan stock
    if (!offer.productos || offer.productos.length === 0) {
      console.error('❌ Oferta sin productos:', offer);
      enqueueSnackbar("Error: La oferta no tiene productos", { variant: "error" });
      return;
    }

    const productosAgotados = offer.productos.filter(p => p.stock === 0);
    
    if (productosAgotados.length > 0) {
      enqueueSnackbar(
        `No se puede agregar la oferta. Productos agotados: ${productosAgotados.map(p => p.nombre).join(', ')}`,
        { variant: "error", autoHideDuration: 5000 }
      );
      return;
    }

    // Verificar que no se exceda el stock de ningún producto
    const productosConStockInsuficiente = offer.productos.filter(p => p.stock < 1);
    
    if (productosConStockInsuficiente.length > 0) {
      enqueueSnackbar(
        "Algunos productos de la oferta tienen stock insuficiente",
        { variant: "warning" }
      );
      return;
    }

    console.log('🛒 Añadiendo oferta al carrito:', offer);
    addOffer(offer);
    
    enqueueSnackbar(
      `Oferta "${offer.titulo}" añadida al carrito por ₡${offer.precio_oferta}`, 
      {
        variant: "success",
        autoHideDuration: 3000,
      }
    );
  };

  const handleAddSingleProduct = (producto, offerTitle) => {
    // ⭐ VALIDACIÓN DE STOCK
    if (producto.stock === 0) {
      enqueueSnackbar(`${producto.nombre} está agotado`, {
        variant: "error",
        autoHideDuration: 2000,
      });
      return;
    }

    if (!producto.disponible) {
      enqueueSnackbar(`${producto.nombre} no está disponible`, {
        variant: "warning",
        autoHideDuration: 2000,
      });
      return;
    }

    add(producto, 1);
    enqueueSnackbar(`${producto.nombre} añadido al carrito`, {
      variant: "success",
      autoHideDuration: 2000,
    });
  };

  const formatDate = (dateString) => {
    // ⭐ FIX: Agregar 'T00:00:00' para forzar zona horaria local
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const calculateSavings = (offer) => {
    if (!offer.productos || offer.productos.length === 0) return 0;
    const totalRegular = offer.productos.reduce((sum, p) => sum + parseFloat(p.precio || 0), 0);
    const savings = totalRegular - parseFloat(offer.precio_oferta || 0);
    return savings > 0 ? savings : 0;
  };

  const calculateDiscountPercentage = (offer) => {
    if (!offer.productos || offer.productos.length === 0) return 0;
    const totalRegular = offer.productos.reduce((sum, p) => sum + parseFloat(p.precio || 0), 0);
    if (totalRegular === 0) return 0;
    const savings = totalRegular - parseFloat(offer.precio_oferta || 0);
    return Math.round((savings / totalRegular) * 100);
  };

  // ⭐ Verificar si la oferta tiene productos agotados
  const ofertaTieneProductosAgotados = (offer) => {
    return offer.productos?.some(p => p.stock === 0) || false;
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
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
          <FaTag className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#5D4037]">Ofertas Especiales</h1>
          <p className="text-[#8D6E63]">
            {offers.length} ofertas activas disponibles
          </p>
        </div>
      </div>

      {/* Offers Grid */}
      {offers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <FaTag className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No hay ofertas activas en este momento</p>
          <p className="text-gray-400 text-sm mt-2">
            Vuelve pronto para descubrir nuevas promociones
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {offers.map((offer, index) => {
            const savings = calculateSavings(offer);
            const discountPercent = calculateDiscountPercentage(offer);
            const totalRegular = offer.productos?.reduce((sum, p) => sum + parseFloat(p.precio || 0), 0) || 0;
            const firstProduct = offer.productos?.[0];
            const tieneAgotados = ofertaTieneProductosAgotados(offer);
            const productosAgotados = offer.productos?.filter(p => p.stock === 0) || [];

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 group ${
                  tieneAgotados 
                    ? 'border-red-300 opacity-75' 
                    : 'border-green-100 hover:border-green-300'
                }`}
              >
                {/* ⭐ Alerta de Productos Agotados */}
                {tieneAgotados && (
                  <div className="bg-red-50 border-b-2 border-red-200 p-3 flex items-start gap-2">
                    <FaExclamationTriangle className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-semibold">Algunos productos de esta oferta están agotados:</p>
                      <ul className="mt-1 space-y-1">
                        {productosAgotados.map((p, idx) => (
                          <li key={idx}>• {p.nombre}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="relative">
                  {/* Discount Badge */}
                  {discountPercent > 0 && !tieneAgotados && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg z-10 transform rotate-12">
                      <div className="text-center">
                        <p className="text-2xl font-bold leading-none">-{discountPercent}%</p>
                        <p className="text-xs">OFF</p>
                      </div>
                    </div>
                  )}

                  {/* Ribbon */}
                  <div className={`absolute top-4 left-0 ${
                    tieneAgotados ? 'bg-gray-400' : 'bg-gradient-to-r from-green-600 to-green-500'
                  } text-white px-6 py-2 rounded-r-full shadow-lg z-10`}>
                    <span className="font-bold text-sm flex items-center gap-2">
                      <FaTag /> {tieneAgotados ? 'NO DISPONIBLE' : 'OFERTA'}
                    </span>
                  </div>

                  {/* Image */}
                  <div className={`h-56 overflow-hidden bg-gradient-to-br from-green-50 to-yellow-50 ${
                    tieneAgotados ? 'opacity-60 grayscale' : ''
                  }`}>
                    {firstProduct?.imagen ? (
                      <img
                        src={firstProduct.imagen}
                        alt={offer.titulo}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaTag className="text-8xl text-green-200" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-[#5D4037] mb-2">
                    {offer.titulo}
                  </h3>

                  {/* Description */}
                  <p className="text-[#8D6E63] mb-4">{offer.descripcion}</p>

                  {/* Products List con Stock */}
                  {offer.productos && offer.productos.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-4 mb-4 border border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        <FaBox className="text-amber-600" />
                        <p className="text-sm font-semibold text-[#5D4037]">
                          Productos incluidos ({offer.productos.length})
                        </p>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        {offer.productos.map((producto, idx) => {
                          const agotado = producto.stock === 0;
                          const stockBajo = producto.stock > 0 && producto.stock <= 5;

                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between bg-white rounded-lg p-2 transition-colors group/item ${
                                agotado 
                                  ? 'opacity-50 bg-red-50' 
                                  : 'hover:bg-amber-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                {agotado ? (
                                  <FaExclamationTriangle className="text-red-600 text-xs flex-shrink-0" />
                                ) : (
                                  <FaCheck className="text-green-600 text-xs flex-shrink-0" />
                                )}
                                <span className={`text-sm font-medium ${
                                  agotado ? 'text-red-600' : 'text-[#5D4037]'
                                }`}>
                                  {producto.nombre}
                                </span>
                                {agotado && (
                                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                    AGOTADO
                                  </span>
                                )}
                                {stockBajo && !agotado && (
                                  <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                                    Solo {producto.stock}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500 line-through">
                                  ₡{producto.precio}
                                </span>
                                {!agotado && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddSingleProduct(producto, offer.titulo);
                                    }}
                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity text-green-600 hover:text-green-700 p-1"
                                    title="Añadir solo este producto"
                                  >
                                    <FaShoppingCart className="text-sm" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Price Comparison */}
                      <div className="border-t border-amber-200 pt-3 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Precio regular:</span>
                          <span className="text-gray-500 line-through">₡{totalRegular.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-[#5D4037]">Precio oferta:</span>
                          <span className="text-2xl font-bold text-green-600">
                            ₡{parseFloat(offer.precio_oferta || 0).toFixed(2)}
                          </span>
                        </div>
                        {savings > 0 && !tieneAgotados && (
                          <div className="bg-green-100 text-green-800 text-center py-2 rounded-md">
                            <p className="text-sm font-semibold">
                              ¡Ahorras ₡{savings.toFixed(2)}!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex flex-col gap-2 text-sm text-[#8D6E63] mb-4 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-gray-400" />
                      <span>Válida desde: <strong>{formatDate(offer.fecha_inicio)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-gray-400" />
                      <span>Hasta: <strong>{formatDate(offer.fecha_fin)}</strong></span>
                    </div>
                  </div>

                  {/* Action Button con validación de stock */}
                  {offer.productos && offer.productos.length > 0 && (
                    <button
                      onClick={() => handleAddAllToCart(offer)}
                      disabled={tieneAgotados}
                      className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 ${
                        tieneAgotados
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white hover:shadow-xl'
                      }`}
                    >
                      <FaShoppingCart className="text-lg" />
                      <span>
                        {tieneAgotados 
                          ? 'Oferta no disponible' 
                          : 'Agregar todos al carrito'}
                      </span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}