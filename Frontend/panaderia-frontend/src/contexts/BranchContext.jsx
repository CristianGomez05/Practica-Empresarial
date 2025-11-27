// Frontend/panaderia-frontend/src/contexts/BranchContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const BranchContext = createContext();

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch debe ser usado dentro de BranchProvider');
  }
  return context;
};

export const BranchProvider = ({ children }) => {
  const [selectedBranch, setSelectedBranch] = useState(() => {
    // Recuperar sucursal del localStorage
    const saved = localStorage.getItem('selectedBranch');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    // Guardar en localStorage cuando cambie
    if (selectedBranch) {
      localStorage.setItem('selectedBranch', JSON.stringify(selectedBranch));
    } else {
      localStorage.removeItem('selectedBranch');
    }
  }, [selectedBranch]);

  const value = {
    selectedBranch,
    setSelectedBranch,
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
};