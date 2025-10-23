// src/pages/OAuthSuccess.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Aquí podrías guardar un token o refrescar estado de autenticación
    navigate("/dashboard");
  }, [navigate]);

  return <div>Conectando con tu cuenta...</div>;
}
