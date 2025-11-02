// src/hooks/useCart.js
import { useContext } from 'react';
import { CartContext } from '../components/cart/CartContext';

export function useCart() {
  const context = useContext(CartContext);
  
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  
  return context;
}

export default useCart;