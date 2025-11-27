// Frontend/panaderia-frontend/src/components/dashboard/BranchSelectorClient.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStore, FaChevronDown, FaMapMarkerAlt, FaPhone, FaCheck } from 'react-icons/fa';
import { useBranch } from '../../contexts/BranchContext';
import api from '../../services/api';

export default function BranchSelectorClient({ showLabel = true }) {
  const { selectedBranch, setSelectedBranch } = useBranch();
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
      setSucursales(data);
      
      // Si no hay sucursal seleccionada, seleccionar la primera
      if (!selectedBranch && data.length > 0) {
        setSelectedBranch(data[0]);
      }
    } catch (error) {
      console.error('❌ Error cargando sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (sucursal) => {
    setSelectedBranch(sucursal);
    setIsOpen(false);
  };

  if (loading || sucursales.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      {showLabel && (
        <label className="block text-sm font-semibold text-[#5D4037] mb-2">
          Selecciona tu sucursal:
        </label>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-amber-500 px-4 py-3 rounded-xl transition-all shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <FaStore className="text-white text-sm" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">
              {selectedBranch?.nombre || 'Seleccionar sucursal'}
            </p>
            {selectedBranch && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaMapMarkerAlt className="text-[10px]" />
                Sucursal activa
              </p>
            )}
          </div>
        </div>
        <FaChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden z-50"
            >
              <div className="p-2 max-h-96 overflow-y-auto">
                {sucursales.map((sucursal) => (
                  <button
                    key={sucursal.id}
                    onClick={() => handleSelect(sucursal)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      sucursal.id === selectedBranch?.id
                        ? 'bg-amber-50 text-amber-700 font-semibold'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      sucursal.id === selectedBranch?.id
                        ? 'bg-amber-100'
                        : 'bg-gray-100'
                    }`}>
                      <FaStore className={
                        sucursal.id === selectedBranch?.id ? 'text-amber-600' : 'text-gray-600'
                      } />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{sucursal.nombre}</p>
                      {sucursal.telefono && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <FaPhone className="text-[10px]" />
                          {sucursal.telefono}
                        </p>
                      )}
                    </div>
                    {sucursal.id === selectedBranch?.id && (
                      <FaCheck className="text-amber-600 text-lg" />
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