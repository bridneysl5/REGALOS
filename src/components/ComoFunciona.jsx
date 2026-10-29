import { QrCode, Smartphone, Sparkles, Images, Music, MessageCircleHeart } from 'lucide-react';

// Demo real: el QR abre ar.momentos365.com/m/DEMO1/ y la foto es exactamente
// la que ese momento reconoce. Si cambias la demo, cambia los dos archivos.
const DEMO_URL = 'https://ar.momentos365.com/m/DEMO1/';

const PASOS = [
  { n: 1, titulo: 'Escanea', texto: 'el QR de tu regalo', Icono: QrCode, color: 'text-rose-500', fondo: 'bg-rose-50' },
  { n: 2, titulo: 'Apunta', texto: 'a la foto o a la dedicatoria', Icono: Smartphone, color: 'text-rose-500', fondo: 'bg-rose-50' },
  { n: 3, titulo: '¡Sorpréndete!', texto: 'la sorpresa aparece encima', Icono: Sparkles, color: 'text-amber-500', fondo: 'bg-amber-50', degradado: true },
];

const CONTENIDOS = [
  { texto: 'Sus fotos', Icono: Images },
  { texto: 'Su canción', Icono: Music },
  { texto: 'Tu mensaje', Icono: MessageCircleHeart },
];

const degradado = 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-500';

const ComoFunciona = () => (
  <section id="como-funciona" className="py-12 md:py-16 bg-rose-50 scroll-mt-20">
    <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center gap-8 md:gap-10">
      <div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900">¿Cómo funciona?</h2>
        <p className={`font-serif italic font-bold text-xl md:text-2xl pr-1 ${degradado}`}>Tu regalo esconde una sorpresa</p>
      </div>

      {/* 3 pasos: filas en celular, tarjetas en computadora */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        {PASOS.map(({ n, titulo, texto, Icono, color, fondo, degradado: conDegradado }) => (
          <div
            key={n}
            className="bg-white rounded-3xl p-4 md:p-8 flex md:flex-col items-center gap-4 md:gap-3 text-left md:text-center shadow-sm"
          >
            <span className={`${fondo} w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0`}>
              <Icono className={`${color} w-7 h-7 md:w-10 md:h-10`} strokeWidth={1.7} />
            </span>
            <span className="flex flex-col">
              <span className="hidden md:block text-xs font-extrabold tracking-widest text-rose-500 mb-1">PASO {n}</span>
              <b className={`font-serif text-xl md:text-2xl ${conDegradado ? degradado : 'text-gray-900'}`}>
                <span className="md:hidden">{n}. </span>{titulo}
              </b>
              <span className="text-sm md:text-base text-gray-500">{texto}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Qué puede aparecer */}
      <div className="flex flex-col items-center gap-3">
        <b className="text-gray-700">Puede aparecer:</b>
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {CONTENIDOS.map(({ texto, Icono }) => (
            <span key={texto} className="bg-white rounded-full px-4 py-2 md:px-5 md:py-3 font-bold text-sm md:text-base text-gray-900 flex items-center gap-2 shadow-sm">
              <Icono size={18} className="text-rose-500" /> {texto}
            </span>
          ))}
        </div>
      </div>

      {/* Pruébalo ahora */}
      <div className="bg-white rounded-3xl p-5 md:px-10 md:py-8 flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-md">
        <img
          src="/momento-vivo/demo-foto.jpg"
          alt="Foto de prueba: apunta tu celular aquí"
          width="210"
          height="210"
          loading="lazy"
          className="w-48 h-48 md:w-52 md:h-52 object-cover rounded-2xl border-[10px] border-white shadow-xl -rotate-3"
        />
        <div className="flex flex-col items-center md:items-start gap-3 md:text-left">
          <h3 className="text-2xl md:text-3xl font-black text-gray-900">Pruébalo ahora</h3>
          {/* Computadora: escanear con el celular y apuntar a la foto de la pantalla */}
          <span className="hidden md:block text-gray-500">Escanea y apunta a esta foto</span>
          <img src="/momento-vivo/qr-demo.png" alt="QR de la demostración" width="120" height="120" loading="lazy" className="hidden md:block w-32 h-32 rounded-xl border-2 border-gray-900 p-1" />
          {/* Celular: no se puede escanear la propia pantalla */}
          <span className="md:hidden text-sm text-gray-500 max-w-xs">Abre esta página en tu computadora y apunta tu celular a la foto. O mira la demo aquí:</span>
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener"
            className="md:hidden bg-gray-900 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2"
          >
            <Sparkles size={18} /> Ver la demo
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default ComoFunciona;
