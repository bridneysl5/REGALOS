// ---------------------------------------------------------------------------
// La página que ve el cliente al escanear el QR:  momentos365.com/momento/A7K2
//
// Mantiene presionada la maceta, brota la flor y cuando florece aparecen sus
// fotos con la canción. Abajo, discreta, la marca Momentos 365 con el botón
// para pedir el suyo.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerMomento } from '../recuerdos';
import { cancionPorId } from '../musica';

const WHATSAPP = '51916098803';
const SITIO = 'https://momentos365.com';

// --- geometría de las flores ------------------------------------------------
const PETALO_PUNTA = 'M0,-24 C 22,-46 20,-92 0,-108 C -20,-92 -22,-46 0,-24 Z';
const RUTA_TALLO = 'M0,-10 C -16,-70 14,-150 0,-232';
const HOJA = 'M0,0 C 26,-10 56,-4 66,16 C 40,30 10,22 0,0 Z';
const ANCLAS = [[0.30, 1, 150], [0.52, -1, -16], [0.74, 1, 166]];

const corona = (n, relleno, giro, clave) =>
  Array.from({ length: n }, (_, i) => (
    <path key={`${clave}${i}`} d={PETALO_PUNTA} fill={relleno}
          transform={`rotate(${giro + i * (360 / n)})`} />
  ));

const semillas = Array.from({ length: 30 }, (_, i) => {
  const a = i * 2.399963;
  const r = 4.6 * Math.sqrt(i) * 1.5;
  return { cx: +(Math.cos(a) * r).toFixed(1), cy: +(Math.sin(a) * r).toFixed(1) };
});

const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

const ESTILOS = `
.m365-momento{
  --noche:#0B1E16; --superficie:#143427; --sol:#FFD24A; --sol-claro:#FFE9A8;
  --ambar:#E39B12; --crema:#F6EEDC; --crema-60:rgba(246,238,220,.62);
  --crema-30:rgba(246,238,220,.26);
  --display:"Bodoni Moda","Didot",Georgia,serif;
  --texto:"Karla","Helvetica Neue",Arial,sans-serif;
  position:fixed; inset:0; z-index:60; overflow-y:auto; overscroll-behavior:contain;
  background:
    radial-gradient(120% 80% at 50% -10%, #1C4634 0%, rgba(28,70,52,0) 60%),
    radial-gradient(90% 60% at 10% 110%, #17392A 0%, rgba(23,57,42,0) 70%),
    var(--noche);
  color:var(--crema); font-family:var(--texto); font-weight:300; line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
.m365-momento *{box-sizing:border-box}
.m365-lienzo-petalos{position:fixed;inset:0;width:100%;height:100%;pointer-events:none}
.m365-marco{
  position:relative; display:flex; flex-direction:column; min-height:100%;
  max-width:980px; margin:0 auto; padding-inline:18px;
  padding-block:calc(16px + env(safe-area-inset-top,0px)) 108px;
}
.m365-escena{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center}
.m365-eyebrow{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--sol);margin:0}
.m365-para{font-family:var(--display);font-style:italic;font-size:clamp(22px,5vw,34px);color:var(--crema);margin:0}
.m365-maceta{background:none;border:0;padding:0;width:min(300px,74vw);cursor:pointer;
  touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
.m365-maceta svg{display:block;width:100%;height:min(44vh,380px)}
.m365-medidor{width:min(220px,58vw);height:2px;border-radius:99px;background:var(--crema-30);overflow:hidden}
.m365-medidor i{display:block;height:100%;width:0;background:var(--sol);border-radius:99px}
.m365-instruccion{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--crema-60);margin:0;min-height:1.6em}
.m365-instruccion.lista{color:var(--sol)}
.m365-album{flex:1;display:flex;flex-direction:column;gap:16px;animation:m365-florece .9s cubic-bezier(.2,.7,.3,1) both}
@keyframes m365-florece{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
.m365-titulo{font-family:var(--display);font-weight:400;font-size:clamp(26px,5vw,40px);line-height:1.05;margin:0;text-align:center}
.m365-titulo em{font-style:italic;color:var(--sol)}
.m365-visor{position:relative;width:100%;max-width:430px;margin:0 auto;aspect-ratio:4/5;
  max-height:min(54vh,520px);background:var(--superficie);border:1px solid rgba(255,210,74,.2);
  border-radius:3px;padding:10px 10px 40px;box-shadow:0 30px 70px -40px rgba(0,0,0,.95)}
.m365-lienzo{position:absolute;inset:10px;bottom:40px;overflow:hidden;background:#0E2A1F;border-radius:2px}
.m365-lienzo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s ease}
.m365-lienzo img.activa{opacity:1}
.m365-pie{position:absolute;left:14px;right:14px;bottom:11px;display:flex;justify-content:space-between;
  font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--crema-60)}
.m365-pie b{font-weight:400;color:var(--sol);font-variant-numeric:tabular-nums}
.m365-mando{display:flex;align-items:center;justify-content:center;gap:14px}
.m365-flecha{width:40px;height:40px;border-radius:99px;border:1px solid var(--crema-30);
  background:transparent;color:var(--crema);font-size:16px;line-height:1;cursor:pointer}
.m365-flecha:hover{border-color:var(--sol);color:var(--sol)}
.m365-puntos{display:flex;gap:8px}
.m365-punto{width:7px;height:7px;padding:0;border-radius:99px;border:1px solid var(--crema-30);background:transparent;cursor:pointer}
.m365-punto[aria-current="true"]{background:var(--sol);border-color:var(--sol)}
.m365-dedicatoria{font-family:var(--display);font-style:italic;font-size:clamp(18px,3.2vw,26px);
  line-height:1.45;color:var(--crema);max-width:32ch;margin:0 auto;text-align:center}
.m365-firma{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--sol);text-align:center;margin:0}
.m365-btn{font-family:var(--texto);font-size:12px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--crema);background:transparent;border:1px solid var(--crema-30);border-radius:99px;
  padding:9px 16px;cursor:pointer;text-decoration:none;display:inline-block;transition:border-color .2s,color .2s}
.m365-btn:hover{border-color:var(--sol);color:var(--sol)}
.m365-marca{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;
  margin-top:auto;padding-top:26px}
.m365-marca img{height:26px;width:auto;opacity:.85;filter:saturate(0) brightness(2.4)}
.m365-marca a.sitio{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--crema-60);text-decoration:none}
.m365-marca a.sitio:hover{color:var(--sol)}
.m365-reproductor{position:fixed;left:0;right:0;bottom:0;background:rgba(9,26,19,.93);
  backdrop-filter:blur(10px);border-top:1px solid rgba(255,210,74,.18);
  padding:11px 18px;padding-bottom:calc(11px + env(safe-area-inset-bottom,0px))}
.m365-reproductor-fila{max-width:980px;margin:0 auto;display:flex;align-items:center;gap:13px}
.m365-play{flex:none;width:40px;height:40px;border-radius:99px;border:0;background:var(--sol);
  color:#2A1B03;font-size:14px;cursor:pointer;display:grid;place-items:center}
.m365-pista{flex:1;min-width:0}
.m365-pista-nombre{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m365-pista-hint{font-size:10.5px;color:var(--crema-60)}
.m365-aviso{text-align:center;max-width:34ch;margin:0 auto;color:var(--crema-60)}
.m365-momento :focus-visible{outline:2px solid var(--sol);outline-offset:3px}
@media (prefers-reduced-motion:reduce){.m365-album{animation:none}}
`;

export default function AlbumRecuerdo({ codigo }) {
  const [estado, setEstado] = useState('cargando'); // cargando | nohay | libre | listo
  const [momento, setMomento] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [iFoto, setIFoto] = useState(0);
  const [sonando, setSonando] = useState(false);

  const audioRef = useRef(null);
  const svgRef = useRef(null);
  const talloRef = useRef(null);
  const hojasRef = useRef([]);
  const florRef = useRef(null);
  const semillaRef = useRef(null);
  const medidorRef = useRef(null);
  const textoRef = useRef(null);
  const lienzoRef = useRef(null);

  const largoRef = useRef(0);
  const progresoRef = useRef(0);
  const presionandoRef = useRef(false);
  const ultimoRef = useRef(0);
  const abiertoRef = useRef(false);
  const petalosRef = useRef([]);

  const quieto = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  const cancion = momento ? cancionPorId(momento.cancion) : null;
  const fotos = momento?.fotos || [];

  // --- tipografías y datos --------------------------------------------------
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz@0,6..96;1,6..96&family=Karla:wght@300;400;600&display=swap';
    document.head.appendChild(link);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { link.remove(); document.body.style.overflow = antes; };
  }, []);

  useEffect(() => {
    let vivo = true;
    obtenerMomento(codigo)
      .then((m) => {
        if (!vivo) return;
        if (!m) return setEstado('nohay');
        setMomento(m);
        setEstado(m.estado === 'listo' && m.fotos.length ? 'listo' : 'libre');
      })
      .catch(() => vivo && setEstado('nohay'));
    return () => { vivo = false; };
  }, [codigo]);

  useEffect(() => {
    document.title = momento?.nombre
      ? `Un momento para ${momento.nombre} · Momentos 365`
      : 'Momentos 365';
  }, [momento]);

  // --- la planta ------------------------------------------------------------
  const puntoEn = (frac) => {
    const t = talloRef.current;
    if (!t || !largoRef.current) return { x: 0, y: 0 };
    const p = t.getPointAtLength(largoRef.current * limitar(frac, 0, 1));
    return { x: p.x, y: p.y };
  };

  const pintar = useCallback((p) => {
    const tallo = talloRef.current;
    if (!tallo) return;
    const largo = largoRef.current;

    const crece = limitar((p - 0.06) / 0.58, 0, 1);
    tallo.style.strokeDasharray = String(largo);
    tallo.style.strokeDashoffset = String(largo * (1 - crece));
    tallo.style.opacity = crece > 0 ? '1' : '0';

    if (semillaRef.current) {
      semillaRef.current.style.opacity = String(limitar(1 - p / 0.12, 0, 1));
    }

    hojasRef.current.forEach((nodo, i) => {
      if (!nodo) return;
      const [frac, lado, giro] = ANCLAS[i];
      const t = limitar((crece - frac) / 0.18, 0, 1);
      const pt = puntoEn(frac);
      const esc = (0.95 - i * 0.12) * t;
      nodo.setAttribute('transform',
        `translate(${pt.x},${pt.y}) scale(${lado * esc},${esc}) rotate(${giro})`);
      nodo.style.opacity = String(t);
    });

    const abre = limitar((p - 0.62) / 0.38, 0, 1);
    if (florRef.current) {
      const pt = puntoEn(1);
      const esc = 0.18 + abre * 0.62;
      florRef.current.setAttribute('transform',
        `translate(${pt.x},${pt.y}) scale(${esc}) rotate(${(1 - abre) * -60})`);
      florRef.current.style.opacity = String(limitar((p - 0.55) / 0.12, 0, 1));
    }

    if (medidorRef.current) medidorRef.current.style.width = `${p * 100}%`;
    if (textoRef.current) {
      textoRef.current.textContent =
        p < 0.05 ? 'Mantén presionada la maceta'
        : p < 0.55 ? 'Sigue… está creciendo'
        : p < 0.999 ? 'Ya casi florece'
        : 'Floreció';
      textoRef.current.classList.toggle('lista', p > 0.55);
    }
  }, []);

  const abrirAlbum = useCallback(() => {
    if (abiertoRef.current) return;
    abiertoRef.current = true;
    pintar(1);
    lluvia();
    const audio = audioRef.current;
    if (audio && cancion) audio.play().then(() => setSonando(true)).catch(() => {});
    setTimeout(() => setAbierto(true), quieto ? 100 : 720);
  }, [cancion, pintar, quieto]);

  useEffect(() => {
    if (estado !== 'listo' || abierto) return;
    const tallo = talloRef.current;
    if (!tallo) return;
    largoRef.current = tallo.getTotalLength();
    progresoRef.current = 0;
    pintar(0);

    let id = 0;
    const bucle = (t) => {
      if (abiertoRef.current) return;
      const dt = Math.min(50, t - (ultimoRef.current || t));
      ultimoRef.current = t;
      progresoRef.current = limitar(
        progresoRef.current + (presionandoRef.current ? dt * 0.00062 : -dt * 0.00016), 0, 1);
      pintar(progresoRef.current);
      if (progresoRef.current >= 1) return abrirAlbum();
      if (presionandoRef.current || progresoRef.current > 0) id = requestAnimationFrame(bucle);
    };

    const empezar = (e) => {
      if (e?.cancelable) e.preventDefault();
      if (presionandoRef.current || abiertoRef.current) return;
      presionandoRef.current = true;
      ultimoRef.current = 0;
      id = requestAnimationFrame(bucle);
    };
    const soltar = () => {
      if (!presionandoRef.current) return;
      presionandoRef.current = false;
      ultimoRef.current = 0;
      id = requestAnimationFrame(bucle);
    };

    const boton = svgRef.current?.parentElement;
    boton?.addEventListener('pointerdown', empezar);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    return () => {
      cancelAnimationFrame(id);
      boton?.removeEventListener('pointerdown', empezar);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
    };
  }, [estado, abierto, pintar, abrirAlbum]);

  // --- pétalos de fondo -----------------------------------------------------
  const lluvia = () => {
    if (quieto) return;
    for (let i = 0; i < 26; i++) {
      petalosRef.current.push(nuevoPetalo(-20 - Math.random() * 140, true));
    }
  };
  const nuevoPetalo = (y, rapido) => ({
    x: Math.random() * window.innerWidth,
    y: y === undefined ? Math.random() * window.innerHeight : y,
    r: 3 + Math.random() * 6,
    vy: (rapido ? 0.9 : 0.16) + Math.random() * (rapido ? 1.4 : 0.42),
    vx: -0.22 + Math.random() * 0.44,
    giro: Math.random() * Math.PI * 2,
    vgiro: -0.008 + Math.random() * 0.016,
    tono: Math.random() < 0.35 ? '255,233,168' : '255,210,74',
    alfa: 0.16 + Math.random() * 0.34,
  });

  useEffect(() => {
    if (estado === 'cargando') return;
    const canvas = lienzoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, id = 0;

    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const sembrar = () => {
      const n = Math.round(Math.min(38, Math.max(14, w / 30)));
      petalosRef.current = Array.from({ length: n }, () => nuevoPetalo());
    };
    const pintarPetalos = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of petalosRef.current) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.giro);
        ctx.fillStyle = `rgba(${p.tono},${p.alfa})`;
        ctx.beginPath(); ctx.ellipse(0, 0, p.r * 0.55, p.r * 1.25, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    };
    const animar = () => {
      for (const p of petalosRef.current) {
        p.y += p.vy; p.x += p.vx + Math.sin(p.y / 90) * 0.22; p.giro += p.vgiro;
        if (p.y - p.r > h) { p.y = -p.r * 2; p.x = Math.random() * w; }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
      }
      if (petalosRef.current.length > 64) petalosRef.current = petalosRef.current.slice(-58);
      pintarPetalos();
      id = requestAnimationFrame(animar);
    };

    medir(); sembrar(); pintarPetalos();
    if (!quieto) id = requestAnimationFrame(animar);
    window.addEventListener('resize', medir);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', medir); };
  }, [estado, quieto]);

  // --- pasar fotos ----------------------------------------------------------
  useEffect(() => {
    if (!abierto || !fotos.length) return;
    const t = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) setIFoto((i) => (i + 1) % fotos.length);
    }, 6000);
    return () => clearInterval(t);
  }, [abierto, fotos.length]);

  useEffect(() => {
    const manejar = (e) => {
      if (!abierto || !fotos.length) return;
      if (e.key === 'ArrowRight') setIFoto((i) => (i + 1) % fotos.length);
      if (e.key === 'ArrowLeft') setIFoto((i) => (i - 1 + fotos.length) % fotos.length);
    };
    window.addEventListener('keydown', manejar);
    return () => window.removeEventListener('keydown', manejar);
  }, [abierto, fotos.length]);

  const alternarMusica = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setSonando(true)).catch(() => {});
    else { a.pause(); setSonando(false); }
  };

  const waPedido = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola Momentos 365, quiero uno de estos álbumes con QR 💛')}`;

  const Marca = () => (
    <div className="m365-marca">
      <img src="/images/logo.png" alt="Momentos 365" />
      <a className="sitio" href={SITIO} target="_blank" rel="noopener noreferrer">momentos365.com</a>
      <a className="m365-btn" href={waPedido} target="_blank" rel="noopener noreferrer">Pedir el mío</a>
    </div>
  );

  // --- pantallas ------------------------------------------------------------
  if (estado === 'cargando') {
    return (
      <div className="m365-momento">
        <style>{ESTILOS}</style>
        <div className="m365-marco"><div className="m365-escena">
          <p className="m365-eyebrow">Momentos 365</p>
          <p className="m365-aviso">Abriendo tu momento…</p>
        </div></div>
      </div>
    );
  }

  if (estado === 'nohay' || estado === 'libre') {
    return (
      <div className="m365-momento">
        <style>{ESTILOS}</style>
        <canvas className="m365-lienzo-petalos" ref={lienzoRef} aria-hidden="true" />
        <div className="m365-marco">
          <div className="m365-escena">
            <p className="m365-eyebrow">Momentos 365</p>
            <h1 className="m365-titulo">
              {estado === 'libre' ? <>Tu momento se está <em>preparando</em></> : <>Este código aún no tiene <em>momento</em></>}
            </h1>
            <p className="m365-aviso">
              {estado === 'libre'
                ? 'Vuelve a escanear en un ratito: estamos cargando las fotos y la canción.'
                : 'Revisa que el código esté bien escrito o escríbenos y lo vemos al toque.'}
            </p>
            <a className="m365-btn" href={waPedido} target="_blank" rel="noopener noreferrer">Escribirnos</a>
          </div>
          <Marca />
        </div>
      </div>
    );
  }

  return (
    <div className="m365-momento">
      <style>{ESTILOS}</style>
      <canvas className="m365-lienzo-petalos" ref={lienzoRef} aria-hidden="true" />

      <div className="m365-marco">
        {!abierto ? (
          <div className="m365-escena">
            <p className="m365-eyebrow">Un regalo para ti</p>
            <p className="m365-para">{momento.nombre || 'Para ti'}</p>

            <button className="m365-maceta" type="button"
                    aria-label="Mantén presionado para hacer crecer la flor">
              <svg ref={svgRef} viewBox="-160 -430 320 540" aria-hidden="true">
                <path ref={talloRef} d={RUTA_TALLO} fill="none" stroke="#4C8C5F"
                      strokeWidth="9" strokeLinecap="round" />
                {ANCLAS.map((_, i) => (
                  <g key={`hoja${i}`} ref={(n) => { hojasRef.current[i] = n; }}>
                    <path d={HOJA} fill="#2C6244" />
                  </g>
                ))}
                <g ref={florRef}>
                  {corona(18, '#E39B12', 10, 'a')}
                  {corona(18, '#FFD24A', 0, 'b')}
                  <circle r="34" fill="#4A2F12" />
                  <circle r="24" fill="#5E3C18" />
                  {semillas.map((s, i) => (
                    <circle key={`s${i}`} cx={s.cx} cy={s.cy} r="2.2" fill="#8A5A1E" />
                  ))}
                </g>
                <g>
                  <path d="M-62,8 L62,8 L46,96 L-46,96 Z" fill="#7A4531" />
                  <path d="M-62,8 L62,8 L58,26 L-58,26 Z" fill="#8E5439" />
                  <ellipse cx="0" cy="10" rx="56" ry="11" fill="#2E1B10" />
                </g>
                <g ref={semillaRef}>
                  <ellipse cx="0" cy="-2" rx="9" ry="13" fill="#E5C88A" transform="rotate(-12)" />
                  <path d="M0,-14 C 5,-6 5,4 0,11" fill="none" stroke="#8A6B3A" strokeWidth="2" />
                </g>
              </svg>
            </button>

            <div className="m365-medidor" aria-hidden="true"><i ref={medidorRef} /></div>
            <p className="m365-instruccion" ref={textoRef}>Mantén presionada la maceta</p>
            <button className="m365-btn" type="button" onClick={abrirAlbum}>Abrir sin esperar</button>
          </div>
        ) : (
          <div className="m365-album">
            <div>
              <p className="m365-eyebrow" style={{ textAlign: 'center' }}>Flores amarillas</p>
              <h1 className="m365-titulo">Para <em>{momento.nombre || 'ti'}</em></h1>
            </div>

            <div className="m365-visor">
              <div className="m365-lienzo">
                {fotos.map((src, i) => (
                  <img key={i} src={src} alt={`Foto ${i + 1}`}
                       className={i === iFoto ? 'activa' : ''} />
                ))}
              </div>
              <div className="m365-pie">
                <span>{momento.deParte ? `De ${momento.deParte}` : 'Con cariño'}</span>
                <b>{iFoto + 1} / {fotos.length}</b>
              </div>
            </div>

            <div className="m365-mando">
              <button className="m365-flecha" type="button" aria-label="Foto anterior"
                      onClick={() => setIFoto((i) => (i - 1 + fotos.length) % fotos.length)}>‹</button>
              <div className="m365-puntos">
                {fotos.map((_, i) => (
                  <button key={i} className="m365-punto" type="button"
                          aria-current={i === iFoto} aria-label={`Foto ${i + 1}`}
                          onClick={() => setIFoto(i)} />
                ))}
              </div>
              <button className="m365-flecha" type="button" aria-label="Foto siguiente"
                      onClick={() => setIFoto((i) => (i + 1) % fotos.length)}>›</button>
            </div>

            {momento.dedicatoria && (
              <p className="m365-dedicatoria">“{momento.dedicatoria}”</p>
            )}
            {momento.deParte && <p className="m365-firma">De {momento.deParte}</p>}

            <Marca />
          </div>
        )}
      </div>

      {cancion && (
        <>
          <audio ref={audioRef} src={cancion.archivo} loop
                 onPlay={() => setSonando(true)} onPause={() => setSonando(false)} />
          {abierto && (
            <div className="m365-reproductor">
              <div className="m365-reproductor-fila">
                <button className="m365-play" type="button" onClick={alternarMusica}
                        aria-label={sonando ? 'Pausar' : 'Reproducir'}>
                  {sonando ? '❙❙' : '▶'}
                </button>
                <div className="m365-pista">
                  <div className="m365-pista-nombre">{cancion.titulo}</div>
                  <div className="m365-pista-hint">Sube el volumen de tu celular 💛</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
