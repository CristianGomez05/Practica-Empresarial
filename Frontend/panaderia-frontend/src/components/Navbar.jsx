import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LoginButton from "../components/auth/LoginButton";

const Navbar = () => {
  const [visible, setVisible] = useState(false);

  // Animación fade-in al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) setVisible(true);
      else setVisible(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll suave a secciones
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 shadow-md ${
        visible ? "bg-[#FFF8F0]/95 backdrop-blur-sm" : "bg-[#FFF8F0]"
      }`}
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => scrollToSection("inicio")}
        >
          <img
            src="/logo.png"
            alt="Panadería Artesanal"
            className="w-8 h-8"
          />
          <span className="text-lg font-semibold text-[#3E2723]">
            Panadería Artesanal
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex gap-8 text-[#4E342E] font-medium">
          <button onClick={() => scrollToSection("inicio")} className="hover:text-[#D35400] transition-colors">
            Inicio
          </button>
          <button onClick={() => scrollToSection("catalogo")} className="hover:text-[#D35400] transition-colors">
            Catálogo
          </button>
          <button onClick={() => scrollToSection("ofertas")} className="hover:text-[#D35400] transition-colors">
            Ofertas
          </button>
          <button onClick={() => scrollToSection("historia")} className="hover:text-[#D35400] transition-colors">
            Historia
          </button>
          <button onClick={() => scrollToSection("contacto")} className="hover:text-[#D35400] transition-colors">
            Contacto
          </button>
        </div>

        {/* Botón de Login */}
        <div className="ml-4">
          <LoginButton />
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
