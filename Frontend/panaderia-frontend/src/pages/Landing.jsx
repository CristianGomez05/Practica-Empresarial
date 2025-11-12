import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaShoppingCart, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaTag, FaClock, FaFire } from "react-icons/fa";
import api from "../services/api";
import { useAuth } from "../components/auth/AuthContext";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productosRes, ofertasRes] = await Promise.all([
        api.get('/productos/'),
        api.get('/ofertas/')
      ]);

      // Filtrar solo productos disponibles
      const productosDisponibles = (productosRes.data.results || productosRes.data)
        .filter(p => p.disponible);

      // Filtrar solo ofertas activas
      const hoy = new Date().toISOString().split('T')[0];
      const ofertasActivas = (ofertasRes.data.results || ofertasRes.data)
        .filter(o => o.fecha_inicio <= hoy && o.fecha_fin >= hoy);

      setProductos(productosDisponibles.slice(0, 8)); // Mostrar máximo 8 productos
      setOfertas(ofertasActivas.slice(0, 3)); // Mostrar máximo 3 ofertas
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (producto) => {
    if (user) {
      // Si está autenticado, ir al dashboard
      navigate('/dashboard/inicio');
    } else {
      // Si no está autenticado, ir al login
      navigate('/login');
    }
  };

  const handleVerCatalogo = () => {
    if (user) {
      navigate('/dashboard/inicio');
    } else {
      // Scroll a la sección de catálogo si no está logueado
      const section = document.getElementById('catalogo');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleVerOfertas = () => {
    const section = document.getElementById('ofertas');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay },
    viewport: { once: true },
  });

  const getDiasRestantes = (fechaFin) => {
    const hoy = new Date();
    const fin = new Date(fechaFin + 'T00:00:00');
    const diff = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="bg-gradient-to-br from-[#fff6ed] via-[#fff8f0] to-[#ffe4d6] text-[#4b2e05] font-sans scroll-smooth">
      <Navbar />

      {/* ================== HERO SECTION ================== */}
      <section id="inicio" className="relative flex flex-col md:flex-row items-center justify-between max-w-7x1 mx-auto px-1 md:px-12 pt-32 md:pt-40 pb-20 gap-10 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        {/* Texto */}
        <motion.div {...fadeUp()} className="flex-1 z-10">

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Pan Artesanal <br />
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Recién Horneado
            </span>
          </h1>

          <p className="text-xl text-[#6b4e16] mb-8 max-w-md leading-relaxed">
            Disfruta del sabor tradicional con ingredientes frescos y naturales.
            Cada pieza está hecha con amor y dedicación.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleVerCatalogo}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Ver Catálogo
            </button>
            <button
              onClick={handleVerOfertas}
              className="border-2 border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 backdrop-blur-sm bg-white/50"
            >
              Nuestras Ofertas
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12">
            <div>
              <p className="text-3xl font-bold text-amber-700">{productos.length}+</p>
              <p className="text-sm text-[#6b4e16]">Productos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-700">{ofertas.length}</p>
              <p className="text-sm text-[#6b4e16]">Ofertas Activas</p>
            </div>
          </div>
        </motion.div>

        {/* Imagen */}
        <motion.div {...fadeUp(0.2)} className="flex-1 flex justify-center z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl blur-2xl opacity-30"></div>
            <img
              src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
              alt="Panadería artesanal"
              className="relative rounded-3xl shadow-2xl w-full max-w-md border-4 border-white"
            />
            {/* Badge flotante */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-2xl shadow-xl transform rotate-12">
              <p className="text-sm font-semibold">¡Ofertas!</p>
              <p className="text-2xl font-bold">Activas</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ================== CATÁLOGO ================== */}
      <section id="catalogo" className="max-w-7xl mx-auto px-6 md:px-12 py-24">
        <div className="text-center mb-16">
          <motion.div {...fadeUp()} className="inline-block">
            <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold border border-amber-200">
              Nuestros Productos
            </span>
          </motion.div>
          <motion.h2 {...fadeUp(0.1)} className="text-4xl md:text-5xl font-bold mt-4 mb-4">
            Catálogo de Productos
          </motion.h2>
          <motion.p {...fadeUp(0.2)} className="text-lg text-[#6b4e16] max-w-2xl mx-auto">
            Productos frescos horneados diariamente con ingredientes de primera calidad
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600"></div>
          </div>
        ) : productos.length > 0 ? (
          <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-8">
            {productos.map((producto, i) => {
              // ⭐ CALCULAR DESCUENTO PORCENTUAL SI HAY OFERTA
              const descuentoPorcentaje = producto.tiene_oferta && producto.oferta_activa
                ? Math.round(((producto.precio - producto.oferta_activa.precio_oferta) / producto.precio) * 100)
                : 0;

              return (
                <motion.div
                  key={producto.id}
                  {...fadeUp(i * 0.05)}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-amber-200"
                >
                  {/* Imagen */}
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
                    {producto.imagen ? (
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-6xl">🥖</span>
                      </div>
                    )}

                    {/* ⭐ Badge de oferta mejorado con descuento */}
                    {producto.tiene_oferta && descuentoPorcentaje > 0 && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-xl shadow-2xl animate-pulse">
                          <p className="text-xs font-bold">OFERTA</p>
                          <p className="text-xl font-black leading-none">-{descuentoPorcentaje}%</p>
                        </div>
                      </div>
                    )}

                    {/* Badge de stock bajo (opcional) */}
                    {producto.stock > 0 && producto.stock <= 5 && (
                      <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        ¡Últimos {producto.stock}!
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#5D4037] mb-2 group-hover:text-amber-700 transition-colors line-clamp-1">
                      {producto.nombre}
                    </h3>

                    {producto.descripcion && (
                      <p className="text-sm text-[#8D6E63] mb-4 line-clamp-2">
                        {producto.descripcion}
                      </p>
                    )}

                    {/* ⭐ NUEVO: Mostrar nombre de la oferta si aplica */}
                    {producto.tiene_oferta && producto.oferta_activa && (
                      <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-red-700 font-semibold flex items-center gap-1">
                          <FaTag className="text-xs" />
                          {producto.oferta_activa.titulo}
                        </p>
                        <p className="text-xs text-red-600 mt-1 line-clamp-1">
                          {producto.oferta_activa.descripcion}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div>
                        {producto.tiene_oferta && producto.oferta_activa ? (
                          <div>
                            <p className="text-sm text-gray-400 line-through">
                              ₡{Number(producto.precio).toLocaleString('es-CR')}
                            </p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-2xl font-bold text-red-600">
                                ₡{Number(producto.oferta_activa.precio_oferta).toLocaleString('es-CR')}
                              </p>
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                                Oferta
                              </span>
                            </div>
                            {/* ⭐ Mostrar ahorro */}
                            <p className="text-xs text-green-600 font-semibold mt-1">
                              Ahorras ₡{(Number(producto.precio) - Number(producto.oferta_activa.precio_oferta)).toLocaleString('es-CR')}
                            </p>
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-amber-700">
                            ₡{Number(producto.precio).toLocaleString('es-CR')}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(producto)}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white p-3 rounded-xl transition-all hover:scale-110 shadow-lg group-hover:shadow-xl"
                        title={producto.tiene_oferta ? "Ver oferta completa" : "Agregar al carrito"}
                      >
                        {producto.tiene_oferta ? (
                          <FaTag className="text-lg" />
                        ) : (
                          <FaShoppingCart className="text-lg" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No hay productos disponibles en este momento</p>
          </div>
        )}

        {productos.length > 0 && (
          <motion.div {...fadeUp(0.3)} className="text-center mt-12">
            <button
              onClick={() => navigate(user ? '/dashboard/inicio' : '/login')}
              className="bg-white border-2 border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
            >
              Ver Catálogo Completo
            </button>
          </motion.div>
        )}
      </section>

      {/* ================== OFERTAS ================== */}
      <section id="ofertas" className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-24 px-6 md:px-12 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.div {...fadeUp()} className="inline-block">
              <span className="bg-gradient-to-r from-red-100 to-orange-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold border border-red-200 flex items-center gap-2">
                <FaFire className="animate-pulse" /> Ofertas Especiales
              </span>
            </motion.div>
            <motion.h2 {...fadeUp(0.1)} className="text-4xl md:text-5xl font-bold mt-4 mb-4">
              Promociones Activas
            </motion.h2>
            <motion.p {...fadeUp(0.2)} className="text-lg text-[#6b4e16] max-w-2xl mx-auto">
              Aprovecha nuestras ofertas por tiempo limitado
            </motion.p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600"></div>
            </div>
          ) : ofertas.length > 0 ? (
            <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-8">
              {ofertas.map((oferta, i) => {
                const diasRestantes = getDiasRestantes(oferta.fecha_fin);
                const productos = oferta.productos || [];
                const primerProducto = productos[0];

                return (
                  <motion.div
                    key={oferta.id}
                    {...fadeUp(i * 0.1)}
                    className="group bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-red-200"
                  >
                    {/* Header con imagen */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-red-50 to-orange-50">
                      {primerProducto?.imagen ? (
                        <img
                          src={primerProducto.imagen}
                          alt={oferta.titulo}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <FaTag className="text-7xl text-orange-300" />
                        </div>
                      )}

                      {/* Badge de múltiples productos */}
                      {productos.length > 1 && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          {productos.length} Productos
                        </div>
                      )}

                      {/* Badge de días restantes */}
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                        {diasRestantes > 0 ? `${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}` : 'Último día'}
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-[#5D4037] mb-2 group-hover:text-red-600 transition-colors">
                        {oferta.titulo}
                      </h3>

                      <p className="text-sm text-[#8D6E63] mb-4 line-clamp-2">
                        {oferta.descripcion}
                      </p>

                      {/* Lista de productos */}
                      {productos.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-200">
                          <p className="text-xs text-amber-800 font-semibold mb-2">
                            {productos.length > 1 ? 'Productos incluidos:' : 'Producto:'}
                          </p>
                          <div className="space-y-1">
                            {productos.slice(0, 2).map((prod, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-[#5D4037] font-medium">{prod.nombre}</span>
                                <span className="text-gray-500 line-through text-xs">₡{prod.precio}</span>
                              </div>
                            ))}
                            {productos.length > 2 && (
                              <p className="text-xs text-amber-700">+{productos.length - 2} más...</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Precio y acción */}
                      <div className="flex items-end justify-between pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Precio Oferta</p>
                          <p className="text-3xl font-bold text-red-600">₡{oferta.precio_oferta}</p>
                        </div>
                        <button
                          onClick={() => navigate(user ? '/dashboard/inicio' : '/login')}
                          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg flex items-center gap-2"
                        >
                          <FaShoppingCart />
                          Pedir
                        </button>
                      </div>

                      {/* Contador de tiempo */}
                      <div className="mt-4 flex items-center gap-2 text-xs text-orange-700 bg-orange-50 px-3 py-2 rounded-lg">
                        <FaClock />
                        <span className="font-semibold">
                          Válido hasta: {new Date(oferta.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <FaTag className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay ofertas activas en este momento</p>
              <p className="text-sm text-gray-400 mt-2">¡Mantente atento a nuestras próximas promociones!</p>
            </div>
          )}
        </div>
      </section>

      {/* ================== HISTORIA ================== */}
      <section id="historia" className="max-w-5xl mx-auto py-24 px-6">
        <motion.div {...fadeUp()} className="text-center">
          <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold border border-amber-200">
            Nuestra Tradición
          </span>
        </motion.div>

        <motion.h2 {...fadeUp(0.1)} className="text-4xl md:text-5xl font-bold text-center mt-4 mb-6">
          Nuestra Historia
        </motion.h2>

        <motion.p
          {...fadeUp(0.2)}
          className="text-lg text-[#6b4e16] leading-relaxed text-center max-w-3xl mx-auto"
        >
          Desde 1985, Panadería Santa Clara ha mantenido la tradición del pan artesanal en cada
          rincón de la ciudad. Lo que comenzó como un pequeño horno familiar se ha convertido en
          una referencia de calidad y calidez, donde cada pieza es horneada con pasión y amor.
          Creemos que el pan no solo alimenta, sino que también une a las personas.
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg border-2 border-amber-100">
            <div className="text-4xl mb-4">🥖</div>
            <h3 className="text-xl font-bold text-[#5D4037] mb-2">Artesanal</h3>
            <p className="text-[#8D6E63]">Cada pan hecho a mano con técnicas tradicionales</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg border-2 border-amber-100">
            <div className="text-4xl mb-4">🌾</div>
            <h3 className="text-xl font-bold text-[#5D4037] mb-2">Natural</h3>
            <p className="text-[#8D6E63]">Ingredientes frescos y de primera calidad</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg border-2 border-amber-100">
            <div className="text-4xl mb-4">❤️</div>
            <h3 className="text-xl font-bold text-[#5D4037] mb-2">Con Amor</h3>
            <p className="text-[#8D6E63]">Horneado con dedicación y pasión</p>
          </div>
        </motion.div>
      </section>

      {/* ================== CONTACTO ================== */}
      <section id="contacto" className="bg-gradient-to-br from-amber-50 to-orange-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold border border-amber-200">
              Contáctanos
            </span>
          </motion.div>

          <motion.h2 {...fadeUp(0.1)} className="text-4xl md:text-5xl font-bold text-center mb-12">
            Visítanos o Escríbenos
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-amber-200">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaMapMarkerAlt className="text-2xl text-white" />
              </div>
              <h3 className="font-bold text-lg text-[#5D4037] mb-2">Ubicación</h3>
              <p className="text-[#8D6E63]">Provincia de Alajuela,<br /> Alajuela, 20101, Costa Rica</p>
            </motion.div>

            <motion.div {...fadeUp(0.2)} className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-amber-200">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaPhoneAlt className="text-2xl text-white" />
              </div>
              <h3 className="font-bold text-lg text-[#5D4037] mb-2">Teléfono</h3>
              <p className="text-[#8D6E63]">+506 8877-1105</p>
            </motion.div>

            <motion.div {...fadeUp(0.3)} className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-amber-200">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaEnvelope className="text-2xl text-white" />
              </div>
              <h3 className="font-bold text-lg text-[#5D4037] mb-2">Email</h3>
              <p className="text-[#8D6E63]">info@panaderiasantaclara.com</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================== FOOTER ================== */}
      <footer className="bg-[#5D4037] text-amber-50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm">© 2025 Panadería Santa Clara — Todos los derechos reservados</p>
          <p className="text-xs text-amber-200 mt-2">Hecho con ❤️ y mucho pan 🥖</p>
        </div>
      </footer>

      {/* Floating CTA Button */}
      {!user && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1 }}
          onClick={() => navigate('/login')}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-40 flex items-center gap-2"
        >
          <FaShoppingCart className="text-xl" />
          <span className="font-semibold pr-2">Hacer Pedido</span>
        </motion.button>
      )}
    </div>
  );
};

export default Landing;