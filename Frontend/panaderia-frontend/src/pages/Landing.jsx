import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { FaShoppingCart, FaHeart, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const Landing = () => {
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay },
    viewport: { once: true },
  });

  return (
    <div className="bg-[#fff6ed] text-[#4b2e05] font-sans scroll-smooth">
      <Navbar />

      {/* ================== HERO SECTION ================== */}
      <section className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-6 md:px-12 pt-32 md:pt-40 gap-10">
        {/* Texto */}
        <motion.div {...fadeUp()} className="flex-1">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Pan Artesanal Recién <br />
            <span className="text-[#d97706]">Horneado</span>
          </h2>
          <p className="text-lg text-[#6b4e16] mb-8 max-w-md">
            Disfruta del sabor tradicional con ingredientes frescos y naturales.
            Horneamos diariamente para ofrecerte la mejor calidad.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="bg-[#d97706] hover:bg-[#b45309] text-white px-6 py-3 rounded-lg font-semibold transition">
              Ver Catálogo
            </button>
            <button className="border-2 border-[#d97706] text-[#d97706] hover:bg-[#d97706] hover:text-white px-6 py-3 rounded-lg font-semibold transition">
              Nuestras Ofertas
            </button>
          </div>
        </motion.div>

        {/* Imagen */}
        <motion.div {...fadeUp(0.2)} className="flex-1 flex justify-center">
          <img
            src="https://images.unsplash.com/photo-1575936123452-b67c3203c357?auto=format&fit=crop&w=800&q=80"
            alt="Panadería artesanal"
            className="rounded-3xl shadow-xl w-full max-w-md"
          />
        </motion.div>
      </section>

      {/* ================== CATÁLOGO ================== */}
      <section id="catalogo" className="max-w-7xl mx-auto px-6 md:px-12 py-24 text-center">
        <motion.h2 {...fadeUp()} className="text-3xl md:text-4xl font-bold mb-4">
          Nuestro Catálogo
        </motion.h2>
        <motion.p {...fadeUp(0.1)} className="text-[#6b4e16] mb-12">
          Productos frescos horneados diariamente
        </motion.p>

        <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-8">
          {[
            {
              img: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=600&q=80",
              title: "Croissants",
              desc: "Mantecados y crujientes",
              price: "$2.50",
            },
            {
              img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
              title: "Pan de Masa Madre",
              desc: "Elaborado con masa natural",
              price: "$4.00",
            },
            {
              img: "https://images.unsplash.com/photo-1607956093307-44e3f6f7a50f?auto=format&fit=crop&w=600&q=80",
              title: "Muffins de Chocolate",
              desc: "Con chips de chocolate belga",
              price: "$3.00",
            },
            {
              img: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=600&q=80",
              title: "Tortas Personalizadas",
              desc: "Diseñadas para cada ocasión",
              price: "Desde $25",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              {...fadeUp(i * 0.1)}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:-translate-y-2 transition-transform"
            >
              <img src={item.img} alt={item.title} className="h-48 w-full object-cover" />
              <div className="p-5 text-left">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-[#6b4e16] text-sm mb-3">{item.desc}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[#d97706] font-bold">{item.price}</span>
                  <button className="bg-[#d97706] hover:bg-[#b45309] text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm">
                    <FaShoppingCart /> Añadir
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================== OFERTAS ================== */}
      <section id="ofertas" className="bg-[#fff1e0] py-24 px-6 md:px-12 text-center">
        <motion.h2 {...fadeUp()} className="text-3xl md:text-4xl font-bold mb-4">
          Ofertas Especiales
        </motion.h2>
        <motion.p {...fadeUp(0.1)} className="text-[#6b4e16] mb-12">
          Aprovecha nuestras promociones limitadas
        </motion.p>

        <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-8 max-w-7xl mx-auto">
          {[
            {
              label: "50% OFF",
              title: "Combo Desayuno",
              desc: "2 Croissants + Café + Jugo",
              price: "$4.00",
            },
            {
              label: "2x1",
              title: "Pan del Día",
              desc: "Compra uno y llévate otro gratis",
              price: "2x1",
            },
            {
              label: "Nuevo",
              title: "Suscripción Semanal",
              desc: "Recibe pan fresco cada semana",
              price: "$20/sem",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              {...fadeUp(i * 0.1)}
              className="bg-white rounded-2xl border border-[#f5d2a8] p-6 shadow hover:shadow-lg transition"
            >
              <div className="text-sm bg-[#fde7d2] text-[#b45309] font-semibold inline-block px-3 py-1 rounded-full mb-3">
                {item.label}
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-[#6b4e16] mb-4">{item.desc}</p>
              <p className="text-[#d97706] font-bold text-2xl mb-4">{item.price}</p>
              <button className="bg-[#d97706] hover:bg-[#b45309] text-white px-5 py-2 rounded-lg font-medium">
                Aprovechar
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================== HISTORIA ================== */}
      <section id="historia" className="max-w-5xl mx-auto py-24 px-6 text-center">
        <motion.h2 {...fadeUp()} className="text-3xl md:text-4xl font-bold mb-6">
          Nuestra Historia
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="text-lg text-[#6b4e16] leading-relaxed max-w-3xl mx-auto"
        >
          Desde 1985, Panadería Santa Clara ha mantenido la tradición del pan artesanal en cada
          rincón de la ciudad. Lo que comenzó como un pequeño horno familiar se ha convertido en
          una referencia de calidad y calidez, donde cada pieza es horneada con pasión y amor.
          Creemos que el pan no solo alimenta, sino que también une a las personas.
        </motion.p>
      </section>

      {/* ================== CONTACTO ================== */}
      <section id="contacto" className="bg-[#fff1e0] py-20 px-6 text-center">
        <motion.h2 {...fadeUp()} className="text-3xl md:text-4xl font-bold mb-6">
          Contáctanos
        </motion.h2>
        <motion.div {...fadeUp(0.1)} className="flex flex-col md:flex-row justify-center gap-10">
          <div className="flex flex-col items-center text-[#4b2e05]">
            <FaMapMarkerAlt className="text-2xl mb-2 text-[#d97706]" />
            <p>Av. Central #456, San Pedro, Costa Rica</p>
          </div>
          <div className="flex flex-col items-center text-[#4b2e05]">
            <FaPhoneAlt className="text-2xl mb-2 text-[#d97706]" />
            <p>+506 2222-3333</p>
          </div>
          <div className="flex flex-col items-center text-[#4b2e05]">
            <FaEnvelope className="text-2xl mb-2 text-[#d97706]" />
            <p>info@panaderiasantaclara.com</p>
          </div>
        </motion.div>
      </section>

      {/* ================== FOOTER ================== */}
      <footer className="text-center py-6 text-sm text-[#6b4e16] border-t border-[#e2d2b0]">
        © 2025 Panadería Santa Clara — Todos los derechos reservados
      </footer>
    </div>
  );
};

export default Landing;
