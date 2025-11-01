// src/pages/dashboard/DashboardProducts.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { useCart } from "../../hooks/useCart";
import { FaShoppingCart, FaSearch, FaExclamationCircle, FaBox } from "react-icons/fa";
import { useSnackbar } from "notistack";

export default function DashboardProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("todos"); // todos, disponibles, agotados
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
    let filtered = products.filter((p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Aplicar filtro de stock
    if (filter === "disponibles") {
      filtered = filtered.filter((p) => p.stock > 0);
    } else if (filter === "agotados") {
      filtered = filtered.filter((p) => p.stock === 0);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, products, filter]);

  const handleAddToCart = (product) => {
    if (product.stock === 0) {
      enqueueSnackbar("Este producto está agotado", { variant: "error" });
      return;
    }

    add(product, 1);
    enqueueSnackbar(`${product.nombre} añadido al carrito`, {
      variant: "success",
      autoHideDuration: 2000,
    });
  };

  // Estadísticas
  const stats = {
    total: products.length,
    disponibles: products.filter(p => p.stock > 0).length,
    agotados: products.filter(p => p.stock === 0).length,
    stockBajo: products.filter(p => p.stock > 0 && p.stock <= 5).length,
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
      {/* Header con Estadísticas */}
      <div>
        <h1 className="text-3xl font-bold text-[#5D4037] mb-4">Nuestros Productos</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <FaBox className="text-blue-600 text-2xl" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <FaBox className="text-green-600 text-2xl" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.disponibles}</p>
                <p className="text-sm text-gray-600">Disponibles</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="flex items-center gap-3">
              <FaExclamationCircle className="text-orange-600 text-2xl" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.stockBajo}</p>
                <p className="text-sm text-gray-600">Stock Bajo</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <FaExclamationCircle className="text-red-600 text-2xl" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.agotados}</p>
                <p className="text-sm text-gray-600">Agotados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search y Filters */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("todos")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "todos"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter("disponibles")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "disponibles"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Disponibles
            </button>
            <button
              onClick={() => setFilter("agotados")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "agotados"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Agotados
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => {
            const estaAgotado = product.stock === 0 || product.esta_agotado;
            const stockBajo = product.stock > 0 && product.stock <= 5;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border-2 group relative ${
                  estaAgotado ? 'border-red-300 opacity-75' : 'border-gray-100'
                }`}
              >
                {/* Badge de Agotado */}
                {estaAgotado && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="bg-red-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                      <FaExclamationCircle size={14} />
                      <span className="font-bold text-xs">Agotado de momento</span>
                    </div>
                  </div>
                )}

                {/* Badge de Stock Bajo */}
                {stockBajo && !estaAgotado && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="bg-orange-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                      <FaExclamationCircle size={12} />
                      <span className="font-semibold text-xs">Solo {product.stock}</span>
                    </div>
                  </div>
                )}

                {/* Image */}
                <div className={`h-48 overflow-hidden bg-gray-100 relative ${
                  estaAgotado ? 'opacity-60' : ''
                }`}>
                  <img
                    src={
                      product.imagen ||
                      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={product.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {estaAgotado && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">AGOTADO</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-[#5D4037] mb-2 line-clamp-1">
                    {product.nombre}
                  </h3>
                  <p className="text-sm text-[#8D6E63] mb-3 line-clamp-2">
                    {product.descripcion || "Producto artesanal de alta calidad"}
                  </p>

                  {/* Stock Info */}
                  <div className="mb-3">
                    {estaAgotado ? (
                      <p className="text-red-600 font-semibold text-sm">
                        ❌ Sin existencias
                      </p>
                    ) : stockBajo ? (
                      <p className="text-orange-600 font-medium text-sm">
                        ⚠️ Quedan {product.stock} unidades
                      </p>
                    ) : (
                      <p className="text-green-600 font-medium text-sm">
                        ✓ {product.stock} unidades disponibles
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-amber-700">
                      ₡{product.precio}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={estaAgotado}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium shadow-md ${
                        estaAgotado
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-lg'
                      }`}
                    >
                      <FaShoppingCart />
                      <span className="hidden sm:inline">
                        {estaAgotado ? 'Agotado' : 'Añadir'}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}