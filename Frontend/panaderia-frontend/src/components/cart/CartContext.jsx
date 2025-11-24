// src/components/cart/CartContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

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

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  // ⭐ NUEVA FUNCIÓN: Extraer productos con cantidades
  const getProductosConCantidad = (offerData) => {
    // Formato nuevo: productos_con_cantidad
    if (offerData.productos_con_cantidad && Array.isArray(offerData.productos_con_cantidad)) {
      return offerData.productos_con_cantidad.map(pc => ({
        ...pc.producto,
        cantidad_oferta: pc.cantidad
      }));
    }
    
    // Formato antiguo: productos (sin cantidades)
    if (offerData.productos && Array.isArray(offerData.productos)) {
      return offerData.productos.map(p => ({
        ...p,
        cantidad_oferta: 1
      }));
    }
    
    return [];
  };

  const add = (itemData, qty = 1) => {
    if (!itemData.isOffer) {
      if (itemData.stock === 0 || itemData.esta_agotado) {
        alert("Este producto está agotado");
        return;
      }

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

    if (itemData.isOffer) {
      const productos = getProductosConCantidad(itemData);
      
      for (const producto of productos) {
        const cantidadRequerida = producto.cantidad_oferta || 1;
        
        if (producto.stock === 0) {
          alert(`El producto "${producto.nombre}" incluido en esta oferta está agotado`);
          return;
        }
        
        if (producto.stock < cantidadRequerida) {
          alert(`Stock insuficiente de "${producto.nombre}". Se necesitan ${cantidadRequerida}, solo hay ${producto.stock}`);
          return;
        }
      }
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.id === itemData.id);
      if (existing) {
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

  // ⭐ FUNCIÓN ACTUALIZADA: Agregar oferta con cantidades
  const addOffer = (offerData) => {
    console.log('🎁 addOffer llamado con:', offerData);

    // ⭐ Usar la nueva función para extraer productos
    const productos = getProductosConCantidad(offerData);
    
    console.log('📦 Productos extraídos con cantidades:', productos);

    // Validar que la oferta tenga productos
    if (productos.length === 0) {
      console.error('❌ No hay productos válidos en la oferta');
      alert("Esta oferta no tiene productos válidos");
      return;
    }

    // ⭐ Validar stock considerando las cantidades requeridas
    const problemasStock = [];
    
    productos.forEach(p => {
      const cantidadRequerida = p.cantidad_oferta || 1;
      
      if (p.stock === 0) {
        problemasStock.push(`${p.nombre} está agotado`);
      } else if (p.stock < cantidadRequerida) {
        problemasStock.push(`${p.nombre}: se necesitan ${cantidadRequerida}, solo hay ${p.stock}`);
      }
    });

    if (problemasStock.length > 0) {
      alert(`No se puede agregar la oferta:\n\n${problemasStock.join('\n')}`);
      return;
    }

    // ⭐ Calcular stock mínimo considerando cantidades
    const stockMinimo = Math.min(
      ...productos.map(p => Math.floor(p.stock / (p.cantidad_oferta || 1)))
    );

    // Crear item de oferta para el carrito
    const offerItem = {
      id: `oferta-${offerData.id}`,
      nombre: offerData.titulo,
      title: offerData.titulo,
      descripcion: offerData.descripcion,
      precio: parseFloat(offerData.precio_oferta),
      imagen: productos[0]?.imagen || null,
      productos: productos, // ⭐ Guardar productos con sus cantidades
      isOffer: true,
      stock: stockMinimo, // ⭐ Stock basado en cantidades
      qty: 1,
      // ⭐ Información adicional para debug
      oferta_id: offerData.id,
      productos_con_cantidad: offerData.productos_con_cantidad
    };

    console.log('🛒 Item de oferta preparado:', offerItem);

    setItems((prev) => {
      const existing = prev.find((i) => i.id === offerItem.id);
      
      if (existing) {
        // Verificar si hay stock suficiente para incrementar
        if (existing.qty + 1 > stockMinimo) {
          alert(`Stock insuficiente para agregar más unidades de esta oferta`);
          return prev;
        }
        
        console.log('✓ Oferta ya existe, incrementando cantidad');
        return prev.map((i) =>
          i.id === offerItem.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        console.log('✓ Nueva oferta agregada al carrito');
        return [...prev, offerItem];
      }
    });
  };

  const updateQty = (id, newQty) => {
    if (newQty < 1) {
      remove(id);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (!item.isOffer && newQty > item.stock) {
            alert(`Solo hay ${item.stock} unidades disponibles de ${item.nombre}`);
            return item;
          }
          
          // ⭐ Validar stock para ofertas
          if (item.isOffer && newQty > item.stock) {
            alert(`Stock insuficiente. Solo se pueden agregar ${item.stock} unidades de esta oferta`);
            return item;
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

  const total = items.reduce((sum, item) => sum + item.precio * item.qty, 0);

  // ⭐ Verificar problemas de stock considerando cantidades
  const hasStockIssues = () => {
    return items.some((item) => {
      if (item.isOffer) {
        // Verificar cada producto de la oferta con su cantidad
        return item.productos?.some((p) => {
          const cantidadRequerida = (p.cantidad_oferta || 1) * item.qty;
          return p.stock === 0 || p.stock < cantidadRequerida;
        });
      } else {
        return item.stock === 0 || item.qty > item.stock;
      }
    });
  };

  // ⭐ NUEVA FUNCIÓN: Obtener detalles de problemas de stock
  const getStockIssues = () => {
    const issues = [];
    
    items.forEach((item) => {
      if (item.isOffer) {
        item.productos?.forEach((p) => {
          const cantidadRequerida = (p.cantidad_oferta || 1) * item.qty;
          if (p.stock === 0) {
            issues.push(`${item.nombre}: "${p.nombre}" está agotado`);
          } else if (p.stock < cantidadRequerida) {
            issues.push(`${item.nombre}: "${p.nombre}" stock insuficiente (${p.stock}/${cantidadRequerida})`);
          }
        });
      } else {
        if (item.stock === 0) {
          issues.push(`${item.nombre} está agotado`);
        } else if (item.qty > item.stock) {
          issues.push(`${item.nombre}: stock insuficiente (${item.stock}/${item.qty})`);
        }
      }
    });
    
    return issues;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        add,
        addOffer,
        updateQty,
        remove,
        clear,
        total,
        hasStockIssues,
        getStockIssues, // ⭐ Nueva función exportada
      }}
    >
      {children}
    </CartContext.Provider>
  );
}