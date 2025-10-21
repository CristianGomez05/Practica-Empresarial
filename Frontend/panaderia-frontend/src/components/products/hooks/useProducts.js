// src/hooks/useProducts.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function useProducts({ page = 1, pageSize = 12, search = '' } = {}) {
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0); // total items si backend lo devuelve
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(page);

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    setError(null);

    const params = {};
    if (pageIndex) params.page = pageIndex;
    if (pageSize) params.page_size = pageSize;
    if (search) params.search = search;

    api.get('/api/productos/', { params })
      .then(res => {
        if (canceled) return;
        // adapta según respuesta del backend:
        // si Django Rest Framework con pagination: res.data.results
        if (res.data.results) {
          setProducts(res.data.results);
          setCount(res.data.count ?? res.data.results.length);
        } else {
          setProducts(res.data);
          setCount(Array.isArray(res.data) ? res.data.length : 0);
        }
      })
      .catch(err => {
        if (canceled) return;
        setError(err);
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });

    return () => { canceled = true; };
  }, [pageIndex, pageSize, search]);

  return { products, count, loading, error, pageIndex, setPageIndex };
}
