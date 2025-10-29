// Frontend/src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaBox, FaTag, FaClipboardList, FaUsers, 
  FaChartLine, FaDollarSign, FaClock, FaCheckCircle 
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    productos: 0,
    ofertas: 0,
    pedidos: 0,
    usuarios: 0,
    ventasTotal: 0,
    pedidosHoy: 0,
    pedidosPendientes: 0,
    pedidosCompletados: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productos, ofertas, pedidos, usuarios] = await Promise.all([
        api.get('/productos/'),
        api.get('/ofertas/'),
        api.get('/pedidos/'),
        api.get('/usuarios/')
      ]);

      const pedidosData = pedidos.data.results || pedidos.data;
      const hoy = new Date().toISOString().split('T')[0];
      
      setStats({
        productos: (productos.data.results || productos.data).length,
        ofertas: (ofertas.data.results || ofertas.data).length,
        pedidos: pedidosData.length,
        usuarios: (usuarios.data.results || usuarios.data).length,
        ventasTotal: pedidosData.reduce((sum, p) => sum + parseFloat(p.total || 0), 0),
        pedidosHoy: pedidosData.filter(p => p.fecha.split('T')[0] === hoy).length,
        pedidosPendientes: pedidosData.filter(p => p.estado === 'recibido' || p.estado === 'en_preparacion').length,
        pedidosCompletados: pedidosData.filter(p => p.estado === 'entregado').length
      });

      setRecentOrders(pedidosData.slice(0, 5));
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... resto del código (ver archivo completo en la implementación)
}