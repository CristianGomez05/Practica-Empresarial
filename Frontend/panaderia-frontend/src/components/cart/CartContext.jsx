// src/components/cart/CartContext.jsx
// ✅ CORREGIDO: Precio como número y carrito por usuario
import React, { createContext, useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  // ✅ Generar key única por usuario
  const getCartKey = () => {
    if (user?.id) {
      return `cart_user_${user.id}`;
    }
    return 'cart_guest'; // Para usuarios no autenticados
  };

  // ✅ Cargar carrito del usuario específico
  useEffect(() => {
    if (user?.id) {
      const cartKey = getCartKey();
      const saved = localStorage.getItem(cartKey);
      
      console.log(`📦 Cargando carrito para usuario ${user.id}:`, cartKey);
      
      if (saved) {
        try {
          const parsedItems = JSON.parse(saved);
          console.log('✅ Carrito cargado:', parsedItems);
          setItems(parsedItems);
        } catch (err) {
          console.error("❌ Error al cargar carrito:", err);
          setItems([]);
        }
      } else {
        console.log('ℹ️ No hay carrito guardado para este usuario');
        setItems([]);
      }
    } else {
      console.log('⚠️ No hay usuario autenticado');
      setItems([]);
    }
  }, [user?.id]);

  // ✅ Guardar carrito cuando cambie
  useEffect(() => {
    if (user?.id) {
      const cartKey = getCartKey();
      console.log(`💾 Guardando carrito para usuario ${user.id}:`, items);
      localStorage.setItem(cartKey, JSON.stringify(items));
    }
  }, [items, user?.id]);

  // ✅ Limpiar carrito de otros usuarios al cambiar de sesión
  useEffect(() => {
    if (!user?.id) {
      console.log('🧹 Usuario cerró sesión, limpiando carrito');
      setItems([]);
    }
  }, [user?.id]);

  // ⭐ Extraer productos con cantidades
  const getProductosConCantidad = (offerData) => {
    if (offerData.productos_con_cantidad && Array.isArray(offerData.productos_con_cantidad)) {
      return offerData.productos_con_cantidad.map(pc => ({
        ...pc.producto,
        cantidad_oferta: pc.cantidad
      }));
    }
    
    if (offerData.productos && Array.isArray(offerData.productos)) {
      return offerData.productos.map(p => ({
        ...p,
        cantidad_oferta: 1
      }));
    }
    
    return [];
  };

  // ✅ Función auxiliar para asegurar que precio sea número
  const ensureNumber = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const add = (itemData, qty = 1) => {
    console.log('➕ Agregando item:', itemData);
    
    // ✅ Validar que el usuario esté autenticado
    if (!user?.id) {
      alert("Debes iniciar sesión para agregar productos al carrito");
      return;
    }

    // ✅ Asegurar que precio sea número
    const precioNumerico = ensureNumber(itemData.precio);
    
    if (precioNumerico === 0) {
      console.error('❌ Precio inválido:', itemData.precio);
      alert("Error: Precio del producto no válido");
      return;
    }

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
        // ✅ Asegurar que precio sea número al crear nuevo item
        return [...prev, { 
          ...itemData, 
          precio: precioNumerico, // ✅ Forzar como número
          qty 
        }];
      }
    });
  };

  const addOffer = (offerData) => {
    console.log('🎁 addOffer llamado con:', offerData);

    // ✅ Validar autenticación
    if (!user?.id) {
      alert("Debes iniciar sesión para agregar ofertas al carrito");
      return;
    }

    const productos = getProductosConCantidad(offerData);
    console.log('📦 Productos extraídos con cantidades:', productos);

    if (productos.length === 0) {
      console.error('❌ No hay productos válidos en la oferta');
      alert("Esta oferta no tiene productos válidos");
      return;
    }

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

    const stockMinimo = Math.min(
      ...productos.map(p => Math.floor(p.stock / (p.cantidad_oferta || 1)))
    );

    // ✅ Asegurar que precio sea número
    const precioOferta = ensureNumber(offerData.precio_oferta);

    if (precioOferta === 0) {
      console.error('❌ Precio de oferta inválido:', offerData.precio_oferta);
      alert("Error: Precio de la oferta no válido");
      return;
    }

    const offerItem = {
      id: `oferta-${offerData.id}`,
      nombre: offerData.titulo,
      title: offerData.titulo,
      descripcion: offerData.descripcion,
      precio: precioOferta, // ✅ Ya es número
      imagen: productos[0]?.imagen || null,
      productos: productos,
      isOffer: true,
      stock: stockMinimo,
      qty: 1,
      oferta_id: offerData.id,
      productos_con_cantidad: offerData.productos_con_cantidad
    };

    console.log('🛒 Item de oferta preparado:', offerItem);

    setItems((prev) => {
      const existing = prev.find((i) => i.id === offerItem.id);
      
      if (existing) {
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

  // ✅ Calcular total asegurando números
  const total = items.reduce((sum, item) => {
    const precio = ensureNumber(item.precio);
    const qty = parseInt(item.qty) || 0;
    return sum + (precio * qty);
  }, 0);

  const hasStockIssues = () => {
    return items.some((item) => {
      if (item.isOffer) {
        return item.productos?.some((p) => {
          const cantidadRequerida = (p.cantidad_oferta || 1) * item.qty;
          return p.stock === 0 || p.stock < cantidadRequerida;
        });
      } else {
        return item.stock === 0 || item.qty > item.stock;
      }
    });
  };

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
        getStockIssues,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}