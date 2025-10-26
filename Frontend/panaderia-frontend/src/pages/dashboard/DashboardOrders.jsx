// src/pages/dashboard/DashboardOrders.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { FaClipboardList, FaClock, FaCheckCircle, FaTruck, FaBox } from "react-icons/fa";

export default function DashboardOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get("/pedidos/");
        const data = res.data.results || res.data;
        // Ordenar por fecha más reciente
        const sorted = data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setOrders(sorted);
      } catch (error) {
        console.error("Error cargando pedidos:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const getStatusInfo = (status) => {
    const statuses = {
      recibido: {
        label: "Recibido",
        icon: FaClock,
        color: "blue",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
      },
      en_preparacion: {
        label: "En Preparación",
        icon: FaBox,
        color: "yellow",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-700",
      },
      listo: {
        label: "Listo",
        icon: FaCheckCircle,
        color: "green",
        bgColor: "bg-green-100",
        textColor: "text-green-700",
      },
      entregado: {
        label: "Entregado",
        icon: FaTruck,
        color: "purple",
        bgColor: "bg-purple-100",
        textColor: "text-purple-700",
      },
    };
    return statuses[status] || statuses.recibido;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaClipboardList className="text-5xl text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-[#5D4037] mb-3">
            No tienes pedidos aún
          </h2>
          <p className="text-[#8D6E63] mb-6">
            Realiza tu primer pedido y aparecerá aquí
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
          <FaClipboardList className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#5D4037]">Mis Pedidos</h1>
          <p className="text-[#8D6E63]">{orders.length} pedidos realizados</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order, index) => {
          const statusInfo = getStatusInfo(order.estado);
          const StatusIcon = statusInfo.icon;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-[#5D4037]">
                      Pedido #{order.id}
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}
                    >
                      <StatusIcon />
                      <span className="font-semibold text-sm">
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-[#8D6E63]">
                    <FaClock className="inline mr-2" />
                    {formatDate(order.fecha)}
                  </div>
                </div>

                {/* Items */}
                {order.detalles && order.detalles.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {order.detalles.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={
                                item.producto?.imagen ||
                                "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=100&q=80"
                              }
                              alt={item.producto?.nombre}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-[#5D4037]">
                              {item.producto?.nombre || "Producto"}
                            </p>
                            <p className="text-sm text-[#8D6E63]">
                              Cantidad: {item.cantidad}
                            </p>
                          </div>
                        </div>
                        <div className="font-semibold text-amber-700">
                          ₡{item.producto?.precio * item.cantidad}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-lg font-semibold text-[#5D4037]">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-amber-700">
                    ₡{order.total || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}