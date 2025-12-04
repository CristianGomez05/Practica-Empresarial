// Frontend/panaderia-frontend/src/components/ImageModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTag, FaFire, FaBox, FaTimes } from "react-icons/fa";

/**
 * Modal reutilizable para mostrar detalles de productos y ofertas
 * 
 * @param {boolean} isOpen - Estado del modal (abierto/cerrado)
 * @param {function} onClose - Función para cerrar el modal
 * @param {string} image - URL de la imagen
 * @param {string} title - Título del producto/oferta
 * @param {string} description - Descripción
 * @param {number} price - Precio regular (opcional)
 * @param {number} offerPrice - Precio de oferta (opcional)
 * @param {number} stock - Stock disponible (opcional)
 * @param {boolean} isOffer - Indica si es una oferta con múltiples productos
 * @param {Array} offerProducts - Array de productos incluidos en la oferta
 */
export default function ImageModal({
  isOpen,
  onClose,
  image,
  title,
  description,
  price,
  offerPrice,
  stock,
  isOffer = false,
  offerProducts = []
}) {
  if (!isOpen) return null;

  // Calcular descuento si hay precio de oferta
  const descuentoPorcentaje = offerPrice && price
    ? Math.round(((price - offerPrice) / price) * 100)
    : offerPrice && offerProducts.length > 0
    ? Math.round((
        (offerProducts.reduce((sum, p) => sum + Number(p.precio || 0), 0) - offerPrice) /
        offerProducts.reduce((sum, p) => sum + Number(p.precio || 0), 0)
      ) * 100)
    : 0;

  const ahorro = offerPrice && price
    ? price - offerPrice
    : offerPrice && offerProducts.length > 0
    ? offerProducts.reduce((sum, p) => sum + Number(p.precio || 0), 0) - offerPrice
    : 0;

  const precioTotalRegular = offerProducts.length > 0
    ? offerProducts.reduce((sum, p) => sum + Number(p.precio || 0), 0)
    : price || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 backdrop-blur-sm z-[9999]"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden relative"
        >
          {/* Botón Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:rotate-90"
          >
            <FaTimes className="text-xl" />
          </button>

          <div className="flex flex-col md:flex-row max-h-[95vh]">
            {/* Sección Izquierda - Imagen */}
            <div className="md:w-1/2 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8 flex items-center justify-center relative overflow-hidden">
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

              {image && (
                <motion.img
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  src={image}
                  alt={title}
                  className="relative z-10 max-w-full max-h-[50vh] md:max-h-[70vh] object-contain rounded-2xl shadow-2xl"
                />
              )}

              {/* Badge de descuento */}
              {offerPrice && descuentoPorcentaje > 0 && (
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-6 left-6 bg-gradient-to-r from-red-500 to-orange-500 text-white px-5 py-3 rounded-2xl shadow-xl"
                >
                  <p className="text-xs font-bold">OFERTA</p>
                  <p className="text-3xl font-black leading-none">
                    -{descuentoPorcentaje}%
                  </p>
                </motion.div>
              )}

              {/* Badge de múltiples productos */}
              {isOffer && offerProducts.length > 1 && (
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute bottom-6 left-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-3 rounded-2xl shadow-xl"
                >
                  <p className="text-sm font-bold">{offerProducts.length} PRODUCTOS</p>
                  <p className="text-xs">Incluidos</p>
                </motion.div>
              )}
            </div>

            {/* Sección Derecha - Información */}
            <div className="md:w-1/2 overflow-y-auto">
              <div className="p-8 space-y-6">
                {/* Header */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {isOffer && (
                    <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold mb-3">
                      <FaTag /> OFERTA ESPECIAL
                    </span>
                  )}
                  <h2 className="text-4xl font-black text-[#5D4037] mb-3 leading-tight">
                    {title || 'Sin título'}
                  </h2>
                  {description && (
                    <p className="text-lg text-[#8D6E63] leading-relaxed">
                      {description}
                    </p>
                  )}
                </motion.div>

                {/* Productos de la Oferta */}
                {isOffer && offerProducts.length > 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200"
                  >
                    <h3 className="text-xl font-bold text-[#5D4037] mb-4 flex items-center gap-2">
                      <FaBox className="text-amber-600" />
                      Productos incluidos en esta oferta:
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {offerProducts.map((prod, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 + (idx * 0.1) }}
                          className="flex items-center gap-4 bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all group"
                        >
                          {prod.imagen && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 group-hover:scale-110 transition-transform">
                              <img
                                src={prod.imagen}
                                alt={prod.nombre}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#5D4037] truncate">{prod.nombre}</p>
                            {prod.descripcion && (
                              <p className="text-sm text-[#8D6E63] line-clamp-1">
                                {prod.descripcion}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm text-gray-400 line-through">
                              ₡{Number(prod.precio).toLocaleString('es-CR')}
                            </p>
                            <span className="text-xs text-green-600 font-semibold">En oferta</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Stock - Solo para productos individuales */}
                {!isOffer && stock !== undefined && stock !== null && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`rounded-2xl p-5 border-2 ${
                      stock === 0
                        ? 'bg-red-50 border-red-200'
                        : stock <= 5
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <p className="text-sm font-semibold mb-2" style={{ 
                      color: stock === 0 ? '#d32f2f' : stock <= 5 ? '#f57c00' : '#388e3c' 
                    }}>
                      Disponibilidad
                    </p>
                    <p className={`text-xl font-bold flex items-center gap-2 ${
                      stock === 0 ? 'text-red-600' : stock <= 5 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      <span className="text-2xl">
                        {stock === 0 ? '❌' : stock <= 5 ? '⚠️' : '✓'}
                      </span>
                      {stock === 0
                        ? 'Sin existencias'
                        : stock <= 5
                        ? `Quedan solo ${stock} unidades`
                        : `${stock} unidades disponibles`}
                    </p>
                  </motion.div>
                )}

                {/* Precio */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-300 shadow-lg"
                >
                  {offerPrice ? (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Precio regular</p>
                      <p className="text-2xl text-gray-400 line-through mb-4">
                        ₡{precioTotalRegular.toLocaleString('es-CR')}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <FaTag className="text-red-600 text-2xl" />
                        <p className="text-base font-bold text-red-700">Precio de oferta</p>
                      </div>
                      <p className="text-5xl font-black text-red-600 mb-4">
                        ₡{Number(offerPrice).toLocaleString('es-CR')}
                      </p>
                      {ahorro > 0 && (
                        <div className="bg-green-100 border-2 border-green-300 rounded-xl p-4">
                          <p className="text-green-800 font-bold text-lg flex items-center gap-2">
                            <FaFire className="text-2xl" />
                            Ahorras ₡{ahorro.toLocaleString('es-CR')}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : price ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Precio</p>
                      <p className="text-5xl font-black text-amber-700">
                        ₡{Number(price).toLocaleString('es-CR')}
                      </p>
                    </div>
                  ) : null}
                </motion.div>

                {/* Botón Cerrar */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Cerrar
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}