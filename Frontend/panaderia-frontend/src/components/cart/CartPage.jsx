// src/components/cart/CartPage.jsx
import React, { useContext, useState } from "react";
import { CartContext } from "./CartContext";
import api from "../../services/api";

export default function CartPage() {
  const { items, updateQty, remove, clear, total } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateOrder = async () => {
    if (!items.length) return;
    setLoading(true);
    setError(null);
    try {
      const body = {
        items: items.map((i) => ({ producto: i.id, cantidad: i.qty })),
        total,
      };
      const res = await api.post("/api/pedidos/", body);
      clear();
      // opcional: redirect a /dashboard/pedidos/:id
      window.location.href = `/dashboard/pedidos/${res.data.id}`;
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el pedido. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) return <div>No hay productos en el carrito.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {items.map((it) => (
        <div key={it.id} className="bg-white p-4 rounded shadow flex items-center justify-between">
          <div>
            <div className="font-semibold">{it.nombre || it.title}</div>
            <div className="text-sm text-gray-600">₡{it.precio} x {it.qty}</div>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" min="1" value={it.qty} onChange={(e) => updateQty(it.id, Math.max(1, Number(e.target.value)))} className="w-16 border rounded px-2 py-1"/>
            <button onClick={() => remove(it.id)} className="text-sm text-red-600">Eliminar</button>
          </div>
        </div>
      ))}

      <div className="bg-white p-4 rounded shadow flex justify-between items-center">
        <div>Total:</div>
        <div className="font-bold text-xl">₡{total}</div>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <div className="flex gap-3">
        <button onClick={handleCreateOrder} disabled={loading} className="bg-amber-700 text-white px-4 py-2 rounded">
          {loading ? "Creando pedido..." : "Crear pedido"}
        </button>
        <button onClick={clear} className="px-4 py-2 rounded border">Vaciar carrito</button>
      </div>
    </div>
  );
}
