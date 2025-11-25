// Frontend/src/components/admin/BranchSelector.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStore, FaChevronDown } from 'react-icons/fa';
import api from '../../services/api';

export default function BranchSelector({ onBranchChange, currentBranch }) {
  const [sucursales, setSucursales] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarSucursales();
  }, []);

  const cargarSucursales = async () => {
    try {
      const response = await api.get('/sucursales/activas/');
      const data = response.data.results || response.data;
      
      // Agregar opción "Todas las sucursales"
      setSucursales([
        { id: null, nombre: 'Todas las sucursales' },
        ...data
      ]);
    } catch (error) {
      console.error('❌ Error cargando sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (sucursal) => {
    onBranchChange(sucursal.id);
    setIsOpen(false);
  };

  const sucursalActual = sucursales.find(s => s.id === currentBranch) || sucursales[0];

  if (loading || sucursales.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-purple-500 px-4 py-2.5 rounded-xl transition-all shadow-sm"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
          <FaStore className="text-white text-sm" />
        </div>
        <div className="text-left">
          <p className="text-xs text-gray-500">Sucursal</p>
          <p className="text-sm font-semibold text-gray-800">
            {sucursalActual?.nombre || 'Seleccionar...'}
          </p>
        </div>
        <FaChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para cerrar al hacer click fuera */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden z-50"
            >
              <div className="p-2 max-h-80 overflow-y-auto">
                {sucursales.map((sucursal) => (
                  <button
                    key={sucursal.id || 'all'}
                    onClick={() => handleSelect(sucursal)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      sucursal.id === currentBranch
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      sucursal.id === currentBranch
                        ? 'bg-purple-100'
                        : 'bg-gray-100'
                    }`}>
                      <FaStore className={
                        sucursal.id === currentBranch ? 'text-purple-600' : 'text-gray-600'
                      } />
                    </div>
                    <span className="flex-1 text-left">{sucursal.nombre}</span>
                    {sucursal.id === currentBranch && (
                      <span className="text-purple-600 text-xl">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}