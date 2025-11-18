// Frontend/src/hooks/useAutoRefresh.js
import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook personalizado para auto-refresh inteligente de datos
 * @param {Function} fetchFunction - Función a ejecutar periódicamente
 * @param {Object} options - Opciones de configuración
 * @param {number} options.interval - Intervalo en ms (default: 30000 = 30s)
 * @param {boolean} options.enabled - Habilitar/deshabilitar refresh (default: true)
 * @param {boolean} options.refreshOnFocus - Refresh al volver a la pestaña (default: true)
 */
export default function useSmartRefresh(fetchFunction, options = {}) {
  const {
    interval = 30000, // 30 segundos por defecto
    enabled = true,
    refreshOnFocus = true
  } = options;

  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  const lastFetchTimeRef = useRef(Date.now());

  const safeFetch = useCallback(async () => {
    // Evitar llamadas simultáneas
    if (isLoadingRef.current || !isMountedRef.current || !enabled) {
      console.log('⏭️ Skipping fetch - already loading, unmounted, or disabled');
      return;
    }

    try {
      isLoadingRef.current = true;
      console.log('🔄 Auto-refresh ejecutando...');
      await fetchFunction();
      lastFetchTimeRef.current = Date.now();
      console.log('✅ Auto-refresh completado');
    } catch (error) {
      console.error('❌ Auto-refresh error:', error.message);
    } finally {
      isLoadingRef.current = false;
    }
  }, [fetchFunction, enabled]);

  // Manejar refresh al volver a la pestaña
  useEffect(() => {
    if (!refreshOnFocus || !enabled) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
        // Solo refrescar si han pasado más de 5 segundos desde el último fetch
        if (timeSinceLastFetch > 5000) {
          console.log('👁️ Tab visible - refreshing data');
          safeFetch();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshOnFocus, enabled, safeFetch]);

  // Auto-refresh periódico
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      console.log('🛑 Auto-refresh deshabilitado');
      return;
    }

    // Configurar intervalo
    console.log(`⏰ Auto-refresh configurado cada ${interval / 1000}s`);
    intervalRef.current = setInterval(safeFetch, interval);

    return () => {
      console.log('🛑 Auto-refresh detenido');
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [safeFetch, interval, enabled]);

  return {
    refresh: safeFetch,
    isRefreshing: isLoadingRef.current
  };
}