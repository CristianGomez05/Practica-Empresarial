// src/components/orders/OrdersList.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await api.get("/api/pedidos/"); // backend: filtra por user
        if (!cancelled) setOrders(res.data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("No se pudo cargar tus pedidos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div>Cargando pedidos...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!orders.length) return <div>No tienes pedidos registrados.</div>;

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
          <div>
            <div className="font-semibold">Pedido #{o.id}</div>
            <div className="text-sm text-gray-600">Estado: {o.estado}</div>
            <div className="text-sm text-gray-600">Total: ₡{o.total}</div>
            <div className="text-sm text-gray-500">Creado: {new Date(o.created_at).toLocaleString()}</div>
          </div>
          <div>
            <Link to={`/dashboard/pedidos/${o.id}`} className="bg-amber-700 text-white px-3 py-2 rounded">
              Ver
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
