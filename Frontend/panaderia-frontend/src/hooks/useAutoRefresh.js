// src/hooks/useAutoRefresh.js
import { useEffect, useRef, useCallback } from 'react';

// Funciones helper (copiar del api.js actualizado)
const isTokenExpiringSoon = () => {
  const token = localStorage.getItem('access') || sessionStorage.getItem('access');
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (exp - now) < fiveMinutes;
  } catch (error) {
    return true;
  }
};

const refreshTokenProactively = async () => {
  const refreshToken = localStorage.getItem('refresh') || sessionStorage.getItem('refresh');
  if (!refreshToken) return false;
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${API_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken })
    });
    if (!response.ok) return false;
    const data = await response.json();
    const storage = localStorage.getItem('refresh') ? localStorage : sessionStorage;
    storage.setItem('access', data.access);
    if (data.refresh) storage.setItem('refresh', data.refresh);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Hook personalizado para refrescar datos automáticamente
 * @param {Function} refreshFunction - Función que se ejecutará para refrescar los datos
 * @param {number} interval - Intervalo en milisegundos (default: 30000 = 30 segundos)
 * @param {boolean} enabled - Si el auto-refresh está habilitado
 */
export default function useAutoRefresh(refreshFunction, interval = 30000, enabled = true) {
  const intervalRef = useRef(null);
  const lastRefreshRef = useRef(Date.now());

  const refresh = useCallback(async () => {
    try {
      // Verificar si el token está por expirar y refrescarlo proactivamente
      if (isTokenExpiringSoon()) {
        console.log('🔄 Token expirando pronto, refrescando...');
        await refreshTokenProactively();
      }

      // Ejecutar la función de refresh
      await refreshFunction();
      lastRefreshRef.current = Date.now();
    } catch (error) {
      console.error('Error en auto-refresh:', error);
    }
  }, [refreshFunction]);

  useEffect(() => {
    if (!enabled) {
      // Limpiar intervalo si está deshabilitado
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Configurar intervalo
    intervalRef.current = setInterval(refresh, interval);

    // Refrescar token al montar si está expirando
    if (isTokenExpiringSoon()) {
      refreshTokenProactively();
    }

    // Limpiar al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refresh, interval, enabled]);

  return { lastRefresh: lastRefreshRef.current, refresh };
}


/**
 * Hook específico para refrescar datos cuando la ventana vuelve a tener foco
 * Útil para cuando el usuario vuelve a la pestaña después de un tiempo
 */
export function useRefreshOnFocus(refreshFunction) {
  const lastRefreshRef = useRef(Date.now());
  const MIN_REFRESH_INTERVAL = 5000; // Mínimo 5 segundos entre refreshes

  useEffect(() => {
    const handleFocus = async () => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshRef.current;

      // Solo refrescar si han pasado al menos 5 segundos
      if (timeSinceLastRefresh >= MIN_REFRESH_INTERVAL) {
        try {
          // Verificar token
          if (isTokenExpiringSoon()) {
            await refreshTokenProactively();
          }

          await refreshFunction();
          lastRefreshRef.current = now;
        } catch (error) {
          console.error('Error refrescando al recuperar foco:', error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshFunction]);
}


/**
 * Hook combinado: auto-refresh + refresh on focus
 */
export function useSmartRefresh(refreshFunction, options = {}) {
  const {
    interval = 30000,
    enabled = true,
    refreshOnFocus = true
  } = options;

  const autoRefresh = useAutoRefresh(refreshFunction, interval, enabled);
  
  if (refreshOnFocus) {
    useRefreshOnFocus(refreshFunction);
  }

  return autoRefresh;
}