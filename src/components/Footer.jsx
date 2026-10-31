import { MessageCircle } from 'lucide-react';
import { CATEGORIES } from '../routes';

// Mismas direcciones que la página /links (LinksView.jsx).
const REDES = [
  { nombre: 'Facebook', url: 'https://www.facebook.com/momentos265' },
  { nombre: 'TikTok', url: 'https://www.tiktok.com/@momentos_365' },
];

/**
 * Pie de página de la tienda.
 * onCategoria(categoria) -> abre el catálogo filtrado
 * onConsulta()           -> abre WhatsApp para consultar
 */
export default function Footer({ onCategoria, onConsulta }) {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <img src="/images/logo-160.webp" alt="Momentos 365 Logo" width="32" height="32" loading="lazy" className="w-8 h-8 object-contain bg-white rounded-md p-1" />
            <span className="text-xl font-bold">Momentos 365</span>
          </div>
          <p className="text-sm leading-relaxed">
            Hacemos que regalar sea una experiencia única. Detalles que emocionan y conectan corazones.
          </p>
          <div className="flex gap-4">
            {REDES.map(r => (
              <a key={r.nombre} href={r.url} target="_blank" rel="noopener noreferrer"
                className="hover:text-rose-500 transition font-bold">{r.nombre}</a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Explorar</h4>
          <ul className="space-y-4 text-sm">
            {CATEGORIES.map(c => (
              <li key={c}>
                <button onClick={() => onCategoria(c)} className="hover:text-rose-500 transition text-left">{c}</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Ayuda</h4>
          <ul className="space-y-4 text-sm">
            <li><button onClick={onConsulta} className="hover:text-rose-500 transition text-left">Hacer una consulta</button></li>
            <li><a href="/links" className="hover:text-rose-500 transition">Todas nuestras redes</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">¿Tienes una fecha especial?</h4>
          <p className="text-sm mb-4">Cuéntanos qué quieres regalar y te ayudamos a armarlo.</p>
          <button onClick={onConsulta}
            className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 text-sm">
            <MessageCircle size={16} /> Escríbenos por WhatsApp
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-gray-800 text-center text-xs">
        © {new Date().getFullYear()} Momentos 365. Todos los derechos reservados.
      </div>
    </footer>
  );
}
