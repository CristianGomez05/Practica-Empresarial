// src/components/orders/OrderDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/api/pedidos/${id}/`)
      .then((r) => { if (!cancelled) setOrder(r.data); })
      .catch((err) => console.error(err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div>Cargando pedido...</div>;
  if (!order) return <div>Pedido no encontrado</div>;

  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="text-xl font-semibold mb-4">Pedido #{order.id}</h3>
      <div className="mb-4">
        <div>Estado: <strong>{order.estado}</strong></div>
        <div>Fecha: {new Date(order.created_at).toLocaleString()}</div>
      </div>

      <div className="space-y-2">
        {order.items?.map((it) => (
          <div key={it.id ?? `${it.producto}-${it.cantidad}`} className="flex items-center justify-between border-b py-2">
            <div>
              <div className="font-medium">{it.producto_nombre || it.producto?.nombre || it.nombre}</div>
              <div className="text-sm text-gray-600">Cantidad: {it.cantidad}</div>
            </div>
            <div className="font-semibold">₡{it.precio_total ?? it.precio}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-right">
        <div className="text-lg font-bold">Total: ₡{order.total}</div>
      </div>
    </div>
  );
}
