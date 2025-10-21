import React from 'react';

export default function ProductCard({ product, onAdd }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col">
      <img
        src={product.imagen || product.image || 'https://via.placeholder.com/400x300'}
        alt={product.nombre || product.title}
        className="h-40 w-full object-cover rounded-md mb-3"
      />
      <h3 className="font-semibold text-lg">{product.nombre || product.title}</h3>
      <p className="text-sm text-gray-600 flex-grow">{product.descripcion || product.desc}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold text-[#d97706]">₡ {product.precio ?? product.price}</span>
        <button
          onClick={() => onAdd?.(product)}
          className="bg-[#d97706] text-white px-3 py-1 rounded-md"
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
