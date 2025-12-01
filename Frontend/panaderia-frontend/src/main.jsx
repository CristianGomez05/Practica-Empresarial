// Frontend/panaderia-frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './components/auth/AuthContext';
import { BranchProvider } from './contexts/BranchContext'; // ⭐ Importar
import { CartProvider } from './contexts/CartContext';
import { SnackbarProvider } from 'notistack';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BranchProvider> {/* ⭐⭐⭐ AGREGAR ESTO */}
        <CartProvider>
          <SnackbarProvider 
            maxSnack={3}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            autoHideDuration={3000}
          >
            <App />
          </SnackbarProvider>
        </CartProvider>
      </BranchProvider> {/* ⭐⭐⭐ CERRAR AQUÍ */}
    </AuthProvider>
  </React.StrictMode>,
);