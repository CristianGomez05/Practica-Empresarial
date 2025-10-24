// src/pages/dashboard/DashboardHome.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../components/auth/AuthContext";
import { useCart } from "../../hooks/useCart";
import { motion } from "framer-motion";
import { FaShoppingCart, FaBox, FaTag, FaClipboardList } from "react-icons/fa";
import api from "../../services/api";

export default function DashboardHome() {
  const { user } = useAuth();
  const { items } = useCart();
  const [stats, setStats] = useState({ products: 0, offers: 0, orders: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [productsRes, offersRes, ordersRes] = await Promise.all([
          api.get("/api/productos/"),
          api.get("/api/ofertas/"),
          api.get("/api/pedidos/"),
        ]);
        
        setStats({
          products: productsRes.data.length || productsRes.data.count || 0,
          offers: offersRes.data.length || offersRes.data.count || 0,
          orders: ordersRes.data.length || ordersRes.data.count || 0,
        });
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    {
      title: "Productos",
      value: stats.products,
      icon: FaBox,
      color: "from-blue-500 to-blue-600",
      link: "/dashboard/productos",
    },
    {
      title: "Ofertas",
      value: stats.offers,
      icon: FaTag,
      color: "from-green-500 to-green-600",
      link: "/dashboard/ofertas",
    },
    {
      title: "En Carrito",
      value: items.reduce((sum, item) => sum + (item.qty || 1), 0),
      icon: FaShoppingCart,
      color: "from-amber-500 to-amber-600",
      link: "/dashboard/carrito",
    },
    {
      title: "Mis Pedidos",
      value: stats.orders,
      icon: FaClipboardList,
      color: "from-purple-500 to-purple-600",
      link: "/dashboard/pedidos",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 shadow-sm border border-amber-100"
      >
        <h1 className="text-3xl font-bold text-[#5D4037] mb-2">
          ¡Bienvenido de nuevo, {user?.username || user?.first_name || "Cliente"}! 🥐
        </h1>
        <p className="text-[#8D6E63]">
          Explora nuestros productos frescos y ofertas especiales del día.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={card.link}
              className="block bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <card.icon className="text-xl" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#5D4037]">
                    {card.value}
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-medium text-[#8D6E63] group-hover:text-amber-700 transition-colors">
                {card.title}
              </h3>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-8 shadow-md border border-gray-100"
      >
        <h2 className="text-2xl font-bold text-[#5D4037] mb-6">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/productos"
            className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all group"
          >
            <FaBox className="text-4xl text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-blue-800">Ver Productos</span>
          </Link>
          
          <Link
            to="/dashboard/ofertas"
            className="flex flex-col items-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all group"
          >
            <FaTag className="text-4xl text-green-600 mb-3 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-green-800">Ver Ofertas</span>
          </Link>
          
          <Link
            to="/dashboard/carrito"
            className="flex flex-col items-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl hover:from-amber-100 hover:to-amber-200 transition-all group"
          >
            <FaShoppingCart className="text-4xl text-amber-600 mb-3 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-amber-800">Ir al Carrito</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}