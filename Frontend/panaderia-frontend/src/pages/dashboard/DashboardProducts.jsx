// src/pages/dashboard/DashboardProducts.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { useCart } from "../../hooks/useCart";
import { FaShoppingCart, FaSearch } from "react-icons/fa";
import { useSnackbar } from "notistack";

export default function DashboardProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { add } = useCart();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await api.get("/productos/");
        const data = res.data.results || res.data;
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error("Error cargando productos:", error);
        enqueueSnackbar("Error al cargar productos", { variant: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter((p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleAddToCart = (product) => {
    add(product, 1);
    enqueueSnackbar(`${product.nombre} añadido al carrito`, {
      variant: "success",
      autoHideDuration: 2000,
    });
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#5D4037]">Nuestros Productos</h1>
          <p className="text-[#8D6E63] mt-1">
            {filteredProducts.length} productos disponibles
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md w-full">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <p className="text-gray-500">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group"
            >
              {/* Image */}
              <div className="h-48 overflow-hidden bg-gray-100">
                <img
                  src={
                    product.imagen ||
                    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={product.nombre}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-[#5D4037] mb-2 line-clamp-1">
                  {product.nombre}
                </h3>
                <p className="text-sm text-[#8D6E63] mb-3 line-clamp-2">
                  {product.descripcion || "Producto artesanal de alta calidad"}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-amber-700">
                    ₡{product.precio}
                  </span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    <FaShoppingCart />
                    <span className="hidden sm:inline">Añadir</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}