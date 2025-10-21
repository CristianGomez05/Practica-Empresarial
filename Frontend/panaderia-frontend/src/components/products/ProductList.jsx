import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await api.get("/api/productos/");
        setProducts(res.data);
      } catch (err) {
        console.error("Error al cargar productos:", err);
        setError("No se pudieron cargar los productos. Inténtalo más tarde.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-700"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg shadow">
        {error}
      </div>
    );

  if (!products.length)
    return (
      <div className="p-6 text-center text-gray-500 bg-amber-50 rounded-lg shadow">
        No hay productos disponibles por el momento.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-center mb-8 text-amber-800">
        🥐 Nuestros Productos
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {products.map((p, index) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-2xl shadow-md overflow-hidden border border-amber-100 hover:shadow-xl transition-all duration-300"
          >
            {/* Imagen del producto (usa placeholder si no hay imagen) */}
            <div className="h-48 w-full overflow-hidden">
              <img
                src={p.imagen || "https://via.placeholder.com/400x300?text=Producto"}
                alt={p.nombre}
                className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Contenido */}
            <div className="p-5 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-1">
                  {p.nombre}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {p.descripcion || "Sin descripción disponible."}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-amber-700">
                  ₡{p.precio}
                </span>
                <button className="bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors duration-300">
                  Agregar
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
