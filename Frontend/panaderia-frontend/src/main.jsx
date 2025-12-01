// Frontend/panaderia-frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './components/auth/AuthContext';
import { BranchProvider } from './contexts/BranchContext';
import { CartProvider } from './components/cart/CartContext';
import { SnackbarProvider } from 'notistack';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BranchProvider>
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
      </BranchProvider>
    </AuthProvider>
  </React.StrictMode>,
);