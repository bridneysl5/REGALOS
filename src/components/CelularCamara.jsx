import './CelularCamara.css';

// Fotos de ejemplo que "salen" del celular en la portada.
// Para cambiarlas: reemplaza los archivos en public/momento-vivo/ con el
// mismo nombre (ejemplo-1.jpg, ejemplo-2.jpg, ejemplo-3.jpg).
const FOTOS = ['/momento-vivo/ejemplo-1.jpg', '/momento-vivo/ejemplo-2.jpg', '/momento-vivo/ejemplo-3.jpg'];
const MENSAJE = 'Te quiero, mi amor';

const Corazon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 21s-7.5-4.6-9.5-9.2C1 8 3.5 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.5 0 6 3.5 4.5 7.3C19.5 16.4 12 21 12 21z" />
  </svg>
);

/** Celular con pantalla transparente que "escanea" el regalo de atrás. */
const CelularCamara = () => (
  <div className="mv-cel" aria-hidden="true">
    <div className="mv-cuerpo" />
    <div className="mv-isla" />
    <div className="mv-marco">
      <span className="mv-esquina a" />
      <span className="mv-esquina b" />
      <span className="mv-esquina c" />
      <span className="mv-esquina d" />
    </div>
    <div className="mv-linea" />

    {FOTOS.map((src, i) => (
      <div key={src} className={`mv-sale mv-foto mv-f${i + 1}`}>
        <img src={src} alt="" loading="lazy" decoding="async" width="104" height="125" />
      </div>
    ))}
    <div className="mv-sale mv-msg">{MENSAJE}</div>

    <span className="mv-sube mv-c1"><Corazon size={18} /></span>
    <span className="mv-sube mv-c2"><Corazon size={15} /></span>
    <span className="mv-sube mv-c3"><Corazon size={13} /></span>
  </div>
);

export default CelularCamara;
