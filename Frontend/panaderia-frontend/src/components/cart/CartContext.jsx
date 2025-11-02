// src/components/cart/CartContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (err) {
        console.error("Error al cargar carrito:", err);
      }
    }
  }, []);

  // Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  // Agregar producto o oferta al carrito con validación de stock
  const add = (itemData, qty = 1) => {
    // Validar stock si es un producto individual
    if (!itemData.isOffer) {
      if (itemData.stock === 0 || itemData.esta_agotado) {
        alert("Este producto está agotado");
        return;
      }

      // Verificar si ya existe en el carrito
      const existing = items.find(
        (i) => i.id === itemData.id && !i.isOffer
      );

      if (existing) {
        const nuevaCantidad = existing.qty + qty;
        if (nuevaCantidad > itemData.stock) {
          alert(`Solo hay ${itemData.stock} unidades disponibles de ${itemData.nombre}`);
          return;
        }
      }
    }

    // Si es una oferta, validar stock de todos sus productos
    if (itemData.isOffer && itemData.productos) {
      for (const producto of itemData.productos) {
        if (producto.stock === 0) {
          alert(`El producto "${producto.nombre}" incluido en esta oferta está agotado`);
          return;
        }
      }
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.id === itemData.id);
      if (existing) {
        // Verificar stock antes de incrementar
        if (!itemData.isOffer && existing.qty + qty > itemData.stock) {
          alert(`Solo hay ${itemData.stock} unidades disponibles`);
          return prev;
        }

        return prev.map((i) =>
          i.id === itemData.id ? { ...i, qty: i.qty + qty } : i
        );
      } else {
        return [...prev, { ...itemData, qty }];
      }
    });
  };

  // ⭐ NUEVA FUNCIÓN: Agregar oferta completa al carrito
  const addOffer = (offerData) => {
    console.log('🎁 addOffer llamado con:', offerData);

    // Validar que la oferta tenga productos
    if (!offerData.productos || offerData.productos.length === 0) {
      alert("Esta oferta no tiene productos válidos");
      return;
    }

    // Validar stock de todos los productos
    const productosAgotados = offerData.productos.filter(p => p.stock === 0);
    if (productosAgotados.length > 0) {
      alert(
        `No se puede agregar la oferta. Productos agotados: ${productosAgotados.map(p => p.nombre).join(', ')}`
      );
      return;
    }

    // Crear item de oferta para el carrito
    const offerItem = {
      id: `oferta-${offerData.id}`, // ID único para ofertas
      nombre: offerData.titulo,
      title: offerData.titulo,
      descripcion: offerData.descripcion,
      precio: parseFloat(offerData.precio_oferta),
      imagen: offerData.productos[0]?.imagen || null,
      productos: offerData.productos,
      isOffer: true,
      stock: Math.min(...offerData.productos.map(p => p.stock)), // Stock = el mínimo de los productos
      qty: 1
    };

    console.log('🛒 Item de oferta preparado:', offerItem);

    setItems((prev) => {
      // Verificar si la oferta ya está en el carrito
      const existing = prev.find((i) => i.id === offerItem.id);
      
      if (existing) {
        // Incrementar cantidad si ya existe
        console.log('✓ Oferta ya existe, incrementando cantidad');
        return prev.map((i) =>
          i.id === offerItem.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        // Agregar nueva oferta
        console.log('✓ Nueva oferta agregada al carrito');
        return [...prev, offerItem];
      }
    });
  };

  // Actualizar cantidad con validación de stock
  const updateQty = (id, newQty) => {
    if (newQty < 1) {
      remove(id);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          // Validar stock para productos individuales
          if (!item.isOffer && newQty > item.stock) {
            alert(`Solo hay ${item.stock} unidades disponibles de ${item.nombre}`);
            return item; // Mantener cantidad actual
          }
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  const remove = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clear = () => {
    setItems([]);
  };

  // Calcular total
  const total = items.reduce((sum, item) => sum + item.precio * item.qty, 0);

  // Verificar si hay problemas de stock en el carrito
  const hasStockIssues = () => {
    return items.some((item) => {
      if (item.isOffer) {
        // Verificar productos de la oferta
        return item.productos?.some((p) => p.stock === 0);
      } else {
        // Verificar stock del producto
        return item.stock === 0 || item.qty > item.stock;
      }
    });
  };

  return (
    <CartContext.Provider
      value={{
        items,
        add,
        addOffer,  // ⭐ Exportar la nueva función
        updateQty,
        remove,
        clear,
        total,
        hasStockIssues,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}