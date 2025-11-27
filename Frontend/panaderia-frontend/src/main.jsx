// Frontend/panaderia-frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './components/auth/AuthContext';
import { CartProvider } from './components/cart/CartContext';
import { BranchProvider } from './contexts/BranchContext'; // ⭐ NUEVO
import { SnackbarProvider } from 'notistack';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BranchProvider> {/* ⭐ NUEVO */}
        <CartProvider>
          <SnackbarProvider 
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <App />
          </SnackbarProvider>
        </CartProvider>
      </BranchProvider>
    </AuthProvider>
  </React.StrictMode>
);