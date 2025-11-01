// src/components/ProductCard.jsx
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ producto }) => {
  const { agregarAlCarrito } = useCart();
  
  const estaAgotado = producto.stock === 0 || producto.esta_agotado;
  
  const handleAgregarCarrito = () => {
    if (estaAgotado) return;
    agregarAlCarrito(producto);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative">
      {/* Badge de Agotado */}
      {estaAgotado && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
            <AlertCircle size={18} />
            <span className="font-semibold text-sm">Agotado de momento</span>
          </div>
        </div>
      )}
      
      {/* Badge de Stock Bajo (opcional) */}
      {!estaAgotado && producto.stock > 0 && producto.stock <= 5 && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-orange-500 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <AlertCircle size={16} />
            <span className="font-medium text-xs">Solo {producto.stock} unidades</span>
          </div>
        </div>
      )}

      {/* Imagen del producto con overlay si está agotado */}
      <div className={`relative h-56 overflow-hidden ${estaAgotado ? 'opacity-60' : ''}`}>
        <img
          src={producto.imagen || 'https://via.placeholder.com/400x300?text=Sin+Imagen'}
          alt={producto.nombre}
          className="w-full h-full object-cover"
        />
        {estaAgotado && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">AGOTADO</span>
          </div>
        )}
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {producto.nombre}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-2">
          {producto.descripcion || 'Sin descripción'}
        </p>

        {/* Stock disponible */}
        <div className="mb-3">
          {estaAgotado ? (
            <p className="text-red-600 font-semibold text-sm">
              Sin existencias
            </p>
          ) : (
            <p className="text-green-600 font-medium text-sm">
              ✓ {producto.stock} {producto.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}
            </p>
          )}
        </div>

        {/* Precio y botón */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-3xl font-bold text-green-600">
              ₡{producto.precio.toLocaleString()}
            </span>
            {producto.tiene_oferta && producto.oferta_activa && (
              <span className="ml-2 text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
                ¡Oferta!
              </span>
            )}
          </div>
          
          <button
            onClick={handleAgregarCarrito}
            disabled={estaAgotado}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
              transition-all duration-300 transform
              ${estaAgotado
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95'
              }
            `}
          >
            <ShoppingCart size={20} />
            {estaAgotado ? 'No disponible' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;