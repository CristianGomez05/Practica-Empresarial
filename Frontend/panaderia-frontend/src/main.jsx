// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./components/auth/AuthContext";
import { CartProvider } from "./components/cart/CartContext";
import { SnackbarProvider } from "notistack";

const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <SnackbarProvider 
      maxSnack={3} 
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={3000}
    >
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </SnackbarProvider>
  </React.StrictMode>
);