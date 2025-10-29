import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaClock, FaBox, FaHome } from 'react-icons/fa';
import api from '../services/api';

export default function OrderConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await api.get(`/pedidos/${id}/`);
        setOrder(res.data);
      } catch (error) {
        console.error('Error cargando pedido:', error);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Pedido no encontrado</h2>
          <button
            onClick={() => navigate('/dashboard/pedidos')}
            className="bg-red-600 text-white px-6 py-3 rounded-lg"
          >
            Ver Mis Pedidos
          </button>
        </div>
      </div>
    );
  }

  const estados = {
    recibido: { icon: FaClock, color: 'blue', text: 'Pedido Recibido' },
    en_preparacion: { icon: FaBox, color: 'yellow', text: 'En Preparación' },
    listo: { icon: FaCheckCircle, color: 'green', text: 'Listo para Recoger' },
    entregado: { icon: FaCheckCircle, color: 'purple', text: 'Entregado' }
  };

  const estadoActual = estados[order.estado] || estados.recibido;
  const Icon = estadoActual.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <FaCheckCircle className="text-white text-5xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-gray-600 text-lg">
            Tu pedido ha sido recibido exitosamente
          </p>
        </motion.div>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-6"
        >
          {/* Order Number & Status */}
          <div className="flex justify-between items-center mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-500 mb-1">Número de Pedido</p>
              <p className="text-3xl font-bold text-gray-800">#{order.id}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-${estadoActual.color}-100`}>
              <Icon className={`text-${estadoActual.color}-600`} />
              <span className={`font-semibold text-${estadoActual.color}-700`}>
                {estadoActual.text}
              </span>
            </div>
          </div>

          {/* Order Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Fecha del Pedido</p>
              <p className="font-semibold text-gray-800">
                {new Date(order.fecha).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Cliente</p>
              <p className="font-semibold text-gray-800">
                {order.usuario?.username || 'Usuario'}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Productos</h3>
            <div className="space-y-3">
              {order.detalles?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.producto?.imagen || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100'}
                      alt={item.producto?.nombre}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {item.producto?.nombre}
                      </p>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.cantidad}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-amber-700">
                    ₡{(item.producto?.precio * item.cantidad).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-gray-800">Total</span>
              <span className="text-3xl font-bold text-amber-700">
                ₡{order.total}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6"
        >
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <FaClock className="text-blue-600" />
            ¿Qué sigue?
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li>• Recibirás un correo de confirmación</li>
            <li>• Te notificaremos cuando tu pedido esté listo</li>
            <li>• Puedes seguir el estado en "Mis Pedidos"</li>
          </ul>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={() => navigate('/dashboard/pedidos')}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all"
          >
            <FaBox />
            Ver Mis Pedidos
          </button>
          <button
            onClick={() => navigate('/dashboard/inicio')}
            className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-6 py-4 rounded-xl font-semibold border-2 border-gray-300 transition-all"
          >
            <FaHome />
            Volver al Inicio
          </button>
        </motion.div>
      </div>
    </div>
  );
}