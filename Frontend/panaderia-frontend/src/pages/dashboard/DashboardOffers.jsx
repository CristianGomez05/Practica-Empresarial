// Frontend/panaderia-frontend/src/pages/dashboard/DashboardOffers.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { useCart } from "../../hooks/useCart";
import { useBranch } from "../../contexts/BranchContext";
import { FaShoppingCart, FaTag, FaClock, FaCheck, FaBox, FaExclamationTriangle, FaStore } from "react-icons/fa"; // ⭐ AGREGAR FaStore
import { useSnackbar } from "notistack";

export default function DashboardOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { add, addOffer } = useCart();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedBranch } = useBranch();

  useEffect(() => {
    async function fetchOffers() {
      // ⭐ No cargar si no hay sucursal seleccionada
      if (!selectedBranch) {
        setLoading(false);
        return;
      }

      try {
        // ⭐ Filtrar por sucursal
        const res = await api.get("/ofertas/", {
          params: { sucursal: selectedBranch.id }
        });
        const data = res.data.results || res.data;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeOffers = data.filter((offer) => {
          const startDate = new Date(offer.fecha_inicio + 'T00:00:00');
          const endDate = new Date(offer.fecha_fin + 'T00:00:00');

          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);

          return today >= startDate && today <= endDate;
        });

        setOffers(activeOffers);
      } catch (error) {
        console.error("Error cargando ofertas:", error);
        enqueueSnackbar("Error al cargar ofertas", { variant: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, [selectedBranch, enqueueSnackbar]); // ⭐ Recargar cuando cambie sucursal

  // ⭐ Mostrar mensaje si no hay sucursal seleccionada
   // ⭐ CAMBIO: Mostrar selector en lugar de bloquear
  if (!selectedBranch) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaStore className="text-5xl text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#5D4037] mb-3">
              Selecciona una sucursal
            </h2>
            <p className="text-[#8D6E63]">
              Para ver los productos disponibles, selecciona una sucursal
            </p>
          </div>

          <BranchSelectorClient />
        </motion.div>
      </div>
    );
  }

  // ⭐ NUEVA FUNCIÓN: Obtener productos con cantidades
  const getProductosConCantidad = (offer) => {
    if (offer.productos_con_cantidad && Array.isArray(offer.productos_con_cantidad)) {
      return offer.productos_con_cantidad.map(pc => ({
        ...pc.producto,
        cantidad_oferta: pc.cantidad
      }));
    }

    if (offer.productos && Array.isArray(offer.productos)) {
      return offer.productos.map(p => ({
        ...p,
        cantidad_oferta: 1
      }));
    }

    return [];
  };

  const handleAddAllToCart = (offer) => {
    const productos = getProductosConCantidad(offer);

    if (productos.length === 0) {
      console.error('❌ Oferta sin productos:', offer);
      enqueueSnackbar("Error: La oferta no tiene productos", { variant: "error" });
      return;
    }

    // ⭐ VALIDACIÓN: Verificar stock considerando las cantidades
    const productosConProblemas = [];

    productos.forEach(p => {
      const cantidadRequerida = p.cantidad_oferta || 1;

      if (p.stock === 0) {
        productosConProblemas.push(`${p.nombre} (agotado)`);
      } else if (p.stock < cantidadRequerida) {
        productosConProblemas.push(`${p.nombre} (stock insuficiente: solo ${p.stock} disponible${p.stock > 1 ? 's' : ''}, se necesitan ${cantidadRequerida})`);
      }
    });

    if (productosConProblemas.length > 0) {
      enqueueSnackbar(
        `No se puede agregar la oferta:\n${productosConProblemas.join('\n')}`,
        { variant: "error", autoHideDuration: 6000 }
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

  const handleAddSingleProduct = (producto, cantidad, offerTitle) => {
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

    if (producto.stock < cantidad) {
      enqueueSnackbar(
        `Stock insuficiente de ${producto.nombre}. Solo hay ${producto.stock} disponible${producto.stock > 1 ? 's' : ''}`,
        {
          variant: "warning",
          autoHideDuration: 3000,
        }
      );
      return;
    }

    add(producto, cantidad);
    enqueueSnackbar(
      `${cantidad}x ${producto.nombre} añadido${cantidad > 1 ? 's' : ''} al carrito`,
      {
        variant: "success",
        autoHideDuration: 2000,
      }
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ⭐ ACTUALIZADO: Calcular ahorros considerando cantidades
  const calculateSavings = (offer) => {
    const productos = getProductosConCantidad(offer);
    if (productos.length === 0) return 0;

    const totalRegular = productos.reduce((sum, p) => {
      const cantidad = p.cantidad_oferta || 1;
      return sum + (parseFloat(p.precio || 0) * cantidad);
    }, 0);

    const savings = totalRegular - parseFloat(offer.precio_oferta || 0);
    return savings > 0 ? savings : 0;
  };

  const calculateDiscountPercentage = (offer) => {
    const productos = getProductosConCantidad(offer);
    if (productos.length === 0) return 0;

    const totalRegular = productos.reduce((sum, p) => {
      const cantidad = p.cantidad_oferta || 1;
      return sum + (parseFloat(p.precio || 0) * cantidad);
    }, 0);

    if (totalRegular === 0) return 0;
    const savings = totalRegular - parseFloat(offer.precio_oferta || 0);
    return Math.round((savings / totalRegular) * 100);
  };

  // ⭐ ACTUALIZADO: Verificar si la oferta tiene problemas de stock
  const verificarStockOferta = (offer) => {
    const productos = getProductosConCantidad(offer);
    const agotados = [];
    const stockInsuficiente = [];

    productos.forEach(p => {
      const cantidadRequerida = p.cantidad_oferta || 1;

      if (p.stock === 0) {
        agotados.push(p);
      } else if (p.stock < cantidadRequerida) {
        stockInsuficiente.push({ ...p, cantidadRequerida });
      }
    });

    return { agotados, stockInsuficiente, tieneProblemas: agotados.length > 0 || stockInsuficiente.length > 0 };
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
            const productos = getProductosConCantidad(offer);
            const { agotados, stockInsuficiente, tieneProblemas } = verificarStockOferta(offer);
            const savings = calculateSavings(offer);
            const discountPercent = calculateDiscountPercentage(offer);

            // ⭐ Calcular total regular considerando cantidades
            const totalRegular = productos.reduce((sum, p) => {
              const cantidad = p.cantidad_oferta || 1;
              return sum + (parseFloat(p.precio || 0) * cantidad);
            }, 0);

            const firstProduct = productos[0];

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 group ${tieneProblemas
                    ? 'border-red-300 opacity-75'
                    : 'border-green-100 hover:border-green-300'
                  }`}
              >
                {/* ⭐ Alerta de Problemas de Stock */}
                {tieneProblemas && (
                  <div className="bg-red-50 border-b-2 border-red-200 p-3 flex items-start gap-2">
                    <FaExclamationTriangle className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                      {agotados.length > 0 && (
                        <>
                          <p className="font-semibold">Productos agotados:</p>
                          <ul className="mt-1 space-y-1">
                            {agotados.map((p, idx) => (
                              <li key={idx}>• {p.cantidad_oferta > 1 ? `${p.cantidad_oferta}x ` : ''}{p.nombre}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {stockInsuficiente.length > 0 && (
                        <>
                          <p className="font-semibold mt-2">Stock insuficiente:</p>
                          <ul className="mt-1 space-y-1">
                            {stockInsuficiente.map((p, idx) => (
                              <li key={idx}>
                                • {p.nombre}: se necesitan {p.cantidadRequerida}, solo hay {p.stock}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative">
                  {/* Discount Badge */}
                  {discountPercent > 0 && !tieneProblemas && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg z-10 transform rotate-12">
                      <div className="text-center">
                        <p className="text-2xl font-bold leading-none">-{discountPercent}%</p>
                        <p className="text-xs">OFF</p>
                      </div>
                    </div>
                  )}

                  {/* Ribbon */}
                  <div className={`absolute top-4 left-0 ${tieneProblemas ? 'bg-gray-400' : 'bg-gradient-to-r from-green-600 to-green-500'
                    } text-white px-6 py-2 rounded-r-full shadow-lg z-10`}>
                    <span className="font-bold text-sm flex items-center gap-2">
                      <FaTag /> {tieneProblemas ? 'NO DISPONIBLE' : 'OFERTA'}
                    </span>
                  </div>

                  {/* Image */}
                  <div className={`h-56 overflow-hidden bg-gradient-to-br from-green-50 to-yellow-50 ${tieneProblemas ? 'opacity-60 grayscale' : ''
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
                  <h3 className="text-2xl font-bold text-[#5D4037] mb-2">
                    {offer.titulo}
                  </h3>

                  <p className="text-[#8D6E63] mb-4">{offer.descripcion}</p>

                  {/* ⭐ Products List CON CANTIDADES */}
                  {productos.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-4 mb-4 border border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        <FaBox className="text-amber-600" />
                        <p className="text-sm font-semibold text-[#5D4037]">
                          Productos incluidos ({productos.reduce((sum, p) => sum + (p.cantidad_oferta || 1), 0)} items)
                        </p>
                      </div>

                      <div className="space-y-2 mb-3">
                        {productos.map((producto, idx) => {
                          const cantidad = producto.cantidad_oferta || 1;
                          const agotado = producto.stock === 0;
                          const stockInsuf = producto.stock < cantidad;
                          const stockBajo = producto.stock > 0 && producto.stock <= 5 && !stockInsuf;

                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between bg-white rounded-lg p-2 transition-colors group/item ${agotado || stockInsuf
                                  ? 'opacity-50 bg-red-50'
                                  : 'hover:bg-amber-50'
                                }`}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                {agotado || stockInsuf ? (
                                  <FaExclamationTriangle className="text-red-600 text-xs flex-shrink-0" />
                                ) : (
                                  <FaCheck className="text-green-600 text-xs flex-shrink-0" />
                                )}

                                {/* ⭐ MOSTRAR CANTIDAD si es mayor a 1 */}
                                <div className="flex items-center gap-2">
                                  {cantidad > 1 && (
                                    <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                      {cantidad}x
                                    </span>
                                  )}
                                  <span className={`text-sm font-medium ${agotado || stockInsuf ? 'text-red-600' : 'text-[#5D4037]'
                                    }`}>
                                    {producto.nombre}
                                  </span>
                                </div>

                                {agotado && (
                                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                    AGOTADO
                                  </span>
                                )}
                                {stockInsuf && !agotado && (
                                  <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                                    Stock: {producto.stock}/{cantidad}
                                  </span>
                                )}
                                {stockBajo && (
                                  <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                                    Solo {producto.stock}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500 line-through">
                                  ₡{(producto.precio * cantidad).toFixed(2)}
                                </span>
                                {!agotado && !stockInsuf && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddSingleProduct(producto, cantidad, offer.titulo);
                                    }}
                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity text-green-600 hover:text-green-700 p-1"
                                    title={`Añadir ${cantidad > 1 ? cantidad + 'x ' : ''}${producto.nombre}`}
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
                        {savings > 0 && !tieneProblemas && (
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

                  {/* Action Button */}
                  {productos.length > 0 && (
                    <button
                      onClick={() => handleAddAllToCart(offer)}
                      disabled={tieneProblemas}
                      className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 ${tieneProblemas
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white hover:shadow-xl'
                        }`}
                    >
                      <FaShoppingCart className="text-lg" />
                      <span>
                        {tieneProblemas
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