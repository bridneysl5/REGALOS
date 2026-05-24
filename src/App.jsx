import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Heart,
  Search,
  Menu,
  X,
  ChevronRight,
  Filter,
  Star,
  Gift,
  Camera,
  Flower2,
  CakeSlice,
  Trash2,
  Plus,
  Minus,
  Eye,
  GraduationCap,
  User
} from 'lucide-react';

import { ALL_PRODUCTS } from './data';
import ProductCard from './components/ProductCard';
import Filters from './components/Filters';
import ProductGrid from './components/ProductGrid';
import MouseHearts from './components/MouseHearts';

const App = () => {
  const [view, setView] = useState('home'); // 'home' or 'shop'
  const [activeFilter, setActiveFilter] = useState({ category: 'Todos', occasion: 'Todos', search: '' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = ['Todos', 'Sets y Gift Boxes', 'Arreglos de Flores', 'Cuadros', 'Tortas y Repostería'];
  const occasions = ['Todos', 'Cumpleaños', 'Graduación', 'Aniversarios y Parejas', 'Para Ella', 'Día del Padre', 'Nacimientos'];

  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter(p => {
      const matchCat = activeFilter.category === 'Todos' ||
        (Array.isArray(p.category) ? p.category.includes(activeFilter.category) : p.category === activeFilter.category);
      const matchOcc = activeFilter.occasion === 'Todos' ||
        (Array.isArray(p.occasion) ? p.occasion.includes(activeFilter.occasion) : p.occasion === activeFilter.occasion);
      const matchSearch = !activeFilter.search || activeFilter.search.trim() === '' || 
        p.name.toLowerCase().includes(activeFilter.search.toLowerCase());
      return matchCat && matchOcc && matchSearch;
    });
  }, [activeFilter]);

  const navigateToShop = (type, value) => {
    if (view === 'home') {
      setActiveFilter({ category: 'Todos', occasion: 'Todos', search: '', [type]: value });
    } else {
      setActiveFilter({ ...activeFilter, [type]: value });
    }
    setView('shop');
    window.scrollTo(0, 0);
  };

  // Cart Functions
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((count, item) => count + item.qty, 0);

  // WhatsApp Format & Send
  const sendWhatsAppOrder = () => {
    if (cart.length === 0) return;
    let message = 'Hola MOMENTOS me gustaría solicitar el siguiente pedido: \n';

    cart.forEach(item => {
      const subtotal = item.price * item.qty;
      message += `*${item.qty}x ${item.name}* \nPrecio unitario: S/${item.price.toFixed(2)} \n*Subtotal:* S/ ${subtotal.toFixed(2)} \n\n`;
    });

    message += `*TOTAL ESTIMADO:* S/ ${cartTotal.toFixed(2)} \n\nPor favor envíenme los detalles para realizar el pago.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/51916098803?text=${encodedMessage}`, '_blank');
  };

  const sendWhatsAppInquiry = () => {
    const message = "Hola MOMENTOS, me gustaría hacer una consulta.";
    window.open(`https://wa.me/51916098803?text=${encodeURIComponent(message)}`, '_blank');
  };

  const Navbar = () => (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-rose-500 p-2 rounded-lg text-white">
              <Gift size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-800">GIFTIFY</span>
          </div>

          <div className="hidden md:flex space-x-8">
            <button onClick={() => setView('home')} className="text-gray-600 hover:text-rose-500 font-medium transition">Inicio</button>
            <button onClick={() => navigateToShop('category', 'Todos')} className="text-gray-600 hover:text-rose-500 font-medium transition">Catálogo</button>
            <div className="relative group">
              <button className="text-gray-600 hover:text-rose-500 font-medium transition flex items-center">
                Ocasiones <ChevronRight size={16} className="rotate-90 ml-1" />
              </button>
              <div className="absolute top-full left-0 bg-white shadow-xl border border-gray-100 rounded-xl py-2 w-48 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                {occasions.filter(o => o !== 'Todos').map(o => (
                  <button
                    key={o}
                    onClick={() => navigateToShop('occasion', o)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-rose-50 hover:text-rose-500"
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Search className="text-gray-500 cursor-pointer" size={20} />
            <div className="relative cursor-pointer" onClick={() => setIsCartOpen(true)}>
              <ShoppingBag className="text-gray-500 hover:text-rose-500 transition" size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  const HomeView = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const sliderImages = useMemo(() => ALL_PRODUCTS.slice(0, 5).map(p => p.img), []);

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
      }, 3500);
      return () => clearInterval(timer);
    }, [sliderImages.length]);

    return (
      <div className="animate-in fade-in duration-500">
        {/* Hero Section */}
        <section className="relative min-h-[600px] flex flex-col items-center justify-center bg-white overflow-hidden pt-12 pb-16">
          {/* Background glow effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-100/40 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/4 w-[400px] h-[400px] bg-amber-50/40 rounded-full blur-3xl -z-10"></div>

          <div className="relative text-center px-4 mb-8 z-10">
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tight mb-2">Regalos</h1>
            <h2 className="text-5xl md:text-7xl font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-500 pr-2">Inolvidables</h2>
          </div>

          {/* Image Slider */}
          <div className="relative w-72 h-96 md:w-80 md:h-[420px] z-10 mt-4">
            {sliderImages.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out origin-bottom ${currentSlide === index
                    ? 'opacity-100 scale-100 rotate-[-3deg] translate-y-0 z-20'
                    : 'opacity-0 scale-95 rotate-3 translate-y-4 z-10'
                  }`}
              >
                <img
                  src={img}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover rounded-3xl border-[12px] md:border-[16px] border-white shadow-xl"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => navigateToShop('category', 'Todos')}
            className="mt-12 bg-gray-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-rose-500 hover:scale-105 transition-all shadow-xl z-10 flex items-center gap-2"
          >
            Explorar Catálogo <ChevronRight />
          </button>
        </section>

        {/* Featured Categories (Circular) */}
        <section className="py-12 max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 md:gap-16">
            {[
              { name: 'Cumpleaños', filterValue: 'Cumpleaños', icon: <CakeSlice size={40} className="text-gray-800 stroke-[1.5]" />, bg: 'bg-yellow-50' },
              { name: 'Aniversario', filterValue: 'Aniversarios y Parejas', icon: <Heart size={40} className="text-gray-800 stroke-[1.5]" />, bg: 'bg-rose-50' },
              { name: 'Día del Padre', filterValue: 'Día del Padre', icon: <User size={40} className="text-gray-800 stroke-[1.5]" />, bg: 'bg-blue-50' },
              { name: 'Graduación', filterValue: 'Graduación', icon: <GraduationCap size={40} className="text-gray-800 stroke-[1.5]" />, bg: 'bg-purple-50' },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => navigateToShop('occasion', item.filterValue)}
                className="flex flex-col items-center group"
              >
                <div className={`${item.bg} w-20 h-20 md:w-24 md:h-24 rounded-full mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                  {item.icon}
                </div>
                <span className="font-medium text-sm text-gray-600 tracking-wide">{item.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Product Categories (Grid) */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Nuestras Colecciones</h2>
                <p className="text-gray-500">¿Qué tipo de detalle estás buscando hoy?</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { name: 'Sets y Gift Boxes', label: 'Sets y Gift Boxes', img: ALL_PRODUCTS.find(p => p.category?.includes('Sets y Gift Boxes'))?.img },
                { name: 'Arreglos de Flores', label: 'Arreglos de Flores', img: ALL_PRODUCTS.find(p => p.category?.includes('Arreglos de Flores'))?.img },
                { name: 'Cuadros', label: 'Cuadros', img: ALL_PRODUCTS.find(p => p.category?.includes('Cuadros'))?.img },
                { name: 'Tortas y Repostería', label: 'Tortas y Repostería', img: ALL_PRODUCTS.find(p => p.category?.includes('Tortas y Repostería'))?.img },
              ].map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => navigateToShop('category', cat.name)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden mb-4 shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl border-4 border-white">
                    <img src={cat.img} className="w-full h-full object-cover" alt={cat.label} loading="lazy" />
                  </div>
                  <h3 className="text-center text-gray-800 font-bold text-sm md:text-base px-2">{cat.label}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Lo más vendido</h2>
              <p className="text-gray-500">Los detalles favoritos de nuestros clientes</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {ALL_PRODUCTS.slice(0, 4).map(product => (
              <ProductCard
                key={product.id}
                product={product}
                addToCart={addToCart}
                setSelectedProduct={setSelectedProduct}
              />
            ))}
          </div>
        </section>
      </div>
    );
  };

  const ShopView = () => (
    <div className="animate-in fade-in duration-500 py-8 max-w-7xl mx-auto px-4">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col gap-3">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar productos..."
            value={activeFilter.search || ''}
            onChange={(e) => setActiveFilter({ ...activeFilter, search: e.target.value })}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-rose-500 focus:border-rose-500 block w-full p-3 pl-10 outline-none"
          />
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <select
          value={activeFilter.occasion}
          onChange={(e) => setActiveFilter({ ...activeFilter, occasion: e.target.value })}
          className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-rose-500 focus:border-rose-500 block w-full p-3 outline-none cursor-pointer"
        >
          <option value="Todos">Todas las Ocasiones</option>
          {occasions.filter(o => o !== 'Todos').map(o => <option key={o} value={o}>{o}</option>)}
        </select>

        <select
          value={activeFilter.category}
          onChange={(e) => setActiveFilter({ ...activeFilter, category: e.target.value })}
          className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-rose-500 focus:border-rose-500 block w-full p-3 outline-none cursor-pointer"
        >
          <option value="Todos">Todas las Categorías</option>
          {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block w-64 shrink-0">
          <Filters
            categories={categories}
            occasions={occasions}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        </div>

        <ProductGrid
          filteredProducts={filteredProducts}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          addToCart={addToCart}
          setSelectedProduct={setSelectedProduct}
        />
      </div>
    </div>
  );

  const Footer = () => (
    <footer className="bg-gray-900 text-gray-400 py-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Gift size={24} className="text-rose-500" />
            <span className="text-xl font-bold">GIFTIFY</span>
          </div>
          <p className="text-sm leading-relaxed">
            Hacemos que regalar sea una experiencia única. Detalles que emocionan y conectan corazones.
          </p>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-rose-500 transition font-bold">IG</span>
            <span className="cursor-pointer hover:text-rose-500 transition font-bold">FB</span>
          </div>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Explorar</h4>
          <ul className="space-y-4 text-sm">
            <li className="hover:text-rose-500 cursor-pointer transition">Nuevos Ingresos</li>
            <li className="hover:text-rose-500 cursor-pointer transition">Los más vendidos</li>
            <li className="hover:text-rose-500 cursor-pointer transition">Gift Cards</li>
            <li className="hover:text-rose-500 cursor-pointer transition">Ofertas</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Ayuda</h4>
          <ul className="space-y-4 text-sm">
            <li className="hover:text-rose-500 cursor-pointer transition">Preguntas Frecuentes</li>
            <li className="hover:text-rose-500 cursor-pointer transition">Políticas de Envío</li>
            <li className="hover:text-rose-500 cursor-pointer transition">Rastrear mi pedido</li>
            <li className="hover:text-rose-500 cursor-pointer transition">Contacto</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Newsletter</h4>
          <p className="text-sm mb-4">Recibe 10% de descuento en tu primera compra.</p>
          <div className="flex gap-2">
            <input type="text" placeholder="Tu email" className="bg-gray-800 border-none rounded-lg px-4 py-2 w-full focus:ring-1 focus:ring-rose-500" />
            <button className="bg-rose-500 text-white p-2 rounded-lg"><ChevronRight /></button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-gray-800 text-center text-xs">
        © 2024 Giftify Regalos. Todos los derechos reservados.
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 relative overflow-hidden">
      <MouseHearts />
      <Navbar />

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 p-4 space-y-4 animate-in slide-in-from-top duration-300">
          <button onClick={() => { setView('home'); setIsMenuOpen(false); }} className="block w-full text-left font-medium py-2">Inicio</button>
          <button onClick={() => { setView('shop'); setIsMenuOpen(false); }} className="block w-full text-left font-medium py-2">Catálogo</button>
          <div className="pt-2 border-t border-gray-50">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Categorías</p>
            {categories.slice(1).map(c => (
              <button key={c} onClick={() => { navigateToShop('category', c); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-gray-600">{c}</button>
            ))}
          </div>
        </div>
      )}

      {view === 'home' ? <HomeView /> : <ShopView />}

      <Footer />

      {/* Floating Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-40">
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative bg-white text-gray-900 p-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:scale-110 transition border border-gray-100"
        >
          <ShoppingBag size={24} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={sendWhatsAppInquiry}
          className="bg-[#25D366] text-white p-4 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.3)] hover:scale-110 transition flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
        </button>
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />
      )}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-rose-500" />
            <h2 className="text-2xl font-bold font-serif">Mi Carrito</h2>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="bg-gray-100 p-6 rounded-full mb-4">
                <ShoppingBag size={48} className="text-gray-300" />
              </div>
              <p className="font-medium text-lg">Tu carrito está vacío</p>
              <p className="text-sm">Agrega productos o arma un regalo.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <img src={item.img} alt={item.name} className="w-20 h-20 object-cover rounded-xl" loading="lazy" />
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight pr-2">{item.name}</h3>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-full px-3 py-1 border border-gray-100">
                      <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-500 hover:text-rose-500"><Minus size={14} /></button>
                      <span className="font-medium text-sm w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-500 hover:text-rose-500"><Plus size={14} /></button>
                    </div>
                    <span className="font-bold text-rose-500">S/ {(item.price * item.qty).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-gray-600">Total Estimado</span>
              <span className="text-2xl font-black text-rose-500">S/ {cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={sendWhatsAppOrder}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 transition shadow-[0_5px_20px_rgba(37,211,102,0.3)] hover:shadow-[0_8px_25px_rgba(37,211,102,0.4)] transform hover:-translate-y-1"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
              Enviar pedido por WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedProduct(null)}
          />
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm text-gray-600 rounded-full hover:bg-gray-100 hover:text-gray-900 transition z-10"
            >
              <X size={24} />
            </button>

            {/* Image */}
            <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-gray-100">
              <img
                src={selectedProduct.img}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Product Details */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
              <div className="flex items-center mb-4 flex-wrap gap-2">
                <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {Array.isArray(selectedProduct.category) ? selectedProduct.category.join(', ') : selectedProduct.category}
                </span>
                <span className="text-gray-400 text-sm ml-2">
                  {Array.isArray(selectedProduct.occasion) ? selectedProduct.occasion.join(', ') : selectedProduct.occasion}
                </span>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {selectedProduct.name}
              </h2>

              <p className="text-4xl font-black text-rose-500 mb-6">
                S/ {selectedProduct.price.toFixed(2)}
              </p>

              <div className="prose prose-sm text-gray-600 mb-8">
                <p>
                  Un detalle especial y único, cuidadosamente elaborado para sorprender.
                  Ideal para {(Array.isArray(selectedProduct.occasion) ? selectedProduct.occasion[0] : selectedProduct.occasion).toLowerCase()} y hacer de cada momento
                  algo verdaderamente inolvidable.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2"><Heart size={16} className="text-rose-400" /> Hecho con amor y dedicación</li>
                  <li className="flex items-center gap-2"><Gift size={16} className="text-rose-400" /> Empaque premium incluido</li>
                  <li className="flex items-center gap-2"><Star size={16} className="text-rose-400" /> Calidad garantizada</li>
                </ul>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full bg-gray-900 hover:bg-rose-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg transform hover:-translate-y-1"
                >
                  <ShoppingBag size={20} />
                  Agregar al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
