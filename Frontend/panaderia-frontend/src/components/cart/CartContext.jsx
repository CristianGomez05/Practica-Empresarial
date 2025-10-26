// src/components/cart/CartContext.jsx
import React, { createContext, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  // Generar clave única para el carrito del usuario
  const getCartKey = () => {
    if (!user) return "cart_items_guest"; // Carrito para usuarios no autenticados
    return `cart_items_${user.user_id || user.id || user.username}`;
  };

  // Cargar carrito del usuario desde localStorage cuando cambie el usuario
  useEffect(() => {
    const cartKey = getCartKey();
    try {
      const raw = localStorage.getItem(cartKey);
      if (raw) {
        const parsedItems = JSON.parse(raw);
        setItems(parsedItems);
        console.log(`🛒 Carrito cargado para: ${cartKey}`, parsedItems);
      } else {
        setItems([]);
        console.log(`🛒 Carrito vacío para: ${cartKey}`);
      }
    } catch (error) {
      console.error("Error cargando carrito:", error);
      setItems([]);
    }
  }, [user]); // Se ejecuta cuando cambia el usuario

  // Guardar carrito en localStorage cuando cambien los items
  useEffect(() => {
    const cartKey = getCartKey();
    try {
      localStorage.setItem(cartKey, JSON.stringify(items));
      console.log(`💾 Carrito guardado para: ${cartKey}`);
    } catch (error) {
      console.error("Error guardando carrito:", error);
    }
  }, [items, user]);

  const add = (product, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) {
        return prev.map((i) => 
          i.id === product.id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...product, qty }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setItems((prev) => 
      prev.map((i) => (i.id === id ? { ...i, qty } : i))
    );
  };

  const remove = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clear = () => {
    setItems([]);
    const cartKey = getCartKey();
    localStorage.removeItem(cartKey);
    console.log(`🗑️ Carrito limpiado para: ${cartKey}`);
  };

  const total = items.reduce(
    (sum, item) => sum + (item.precio ?? item.price ?? 0) * (item.qty || 1), 
    0
  );

  return (
    <CartContext.Provider value={{ items, add, updateQty, remove, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}