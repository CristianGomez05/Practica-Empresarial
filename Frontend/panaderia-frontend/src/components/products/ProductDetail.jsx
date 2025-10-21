import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useParams } from 'react-router-dom';

export default function ProductDetail(){
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get(`/api/productos/${id}/`)
      .then(res => setProduct(res.data))
      .catch(console.error)
      .finally(()=>setLoading(false));
  }, [id]);

  if(loading) return <div>Cargando...</div>;
  if(!product) return <div>Producto no encontrado</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{product.nombre}</h1>
      <img src={product.imagen} alt={product.nombre} className="w-full h-80 object-cover rounded-lg mb-4"/>
      <p className="mb-4">{product.descripcion}</p>
      <div className="font-bold text-xl">₡ {product.precio}</div>
    </div>
  );
}
