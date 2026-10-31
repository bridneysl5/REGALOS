// ---------------------------------------------------------------------------
// Pestaña "Momentos RA" del admin: crea los regalos con realidad aumentada
// (ar.momentos365.com/m/CODIGO/) desde el celular o la laptop, sin git.
//
// 1. Foto del regalo (la que se imprime y la cámara reconoce)
// 2. Lo que aparece encima: fotos o video
// 3. Música opcional (de la biblioteca o un MP3)
// 4. Textos → Crear → QR listo para descargar
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import {
  Sparkles, Image as ImageIcon, Images, Video, Music, Type, QrCode, Download, Copy, Check,
  ExternalLink, Trash2, Plus, X, KeyRound, RefreshCw, Loader2, Search,
} from 'lucide-react';
import { MUSICA } from '../../musica';
import {
  MAX_FOTOS, MB, mb, leerClave, guardarClave, borrarClave, listarMomentos, eliminarMomentoRA,
  prepararFotoRegalo, calidad, infoVideo, crearMomentoRA, qrComoDataUrl, descargarQR, urlDelMomento,
} from '../../raMomentos';

const COLOR_NIVEL = {
  ok: 'text-green-400 bg-green-400/10',
  medio: 'text-amber-400 bg-amber-400/10',
  mal: 'text-red-400 bg-red-400/10',
};

const Paso = ({ n, titulo, Icono, children }) => (
  <section className="bg-gray-800 rounded-2xl p-4 space-y-3">
    <h3 className="text-white font-semibold flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-[#FF2B5E] text-white text-xs font-bold flex items-center justify-center">{n}</span>
      <Icono size={16} className="text-gray-400" /> {titulo}
    </h3>
    {children}
  </section>
);

const BotonArchivo = ({ children, ...props }) => (
  <label className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl px-4 py-3 text-sm font-medium cursor-pointer transition">
    {children}
    <input type="file" className="hidden" {...props} />
  </label>
);

/* ── Clave de subida (una vez por equipo) ───────────────────────────────── */
function PedirClave({ onLista }) {
  const [clave, setClave] = useState('');
  const [probando, setProbando] = useState(false);
  const [error, setError] = useState('');

  const probar = async (e) => {
    e.preventDefault();
    setProbando(true); setError('');
    try {
      await listarMomentos(clave.trim());
      guardarClave(clave.trim());
      onLista(clave.trim());
    } catch (err) {
      setError(err.status === 401 ? 'Clave incorrecta' : err.message);
    } finally { setProbando(false); }
  };

  return (
    <form onSubmit={probar} className="bg-gray-800 rounded-2xl p-5 space-y-3 max-w-md">
      <p className="text-white font-semibold flex items-center gap-2"><KeyRound size={16} /> Clave de subida</p>
      <p className="text-gray-400 text-sm">Es la clave CLAVE_SUBIDA de Cloudflare. Se pide una sola vez en este equipo.</p>
      <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="off"
        className="w-full bg-gray-900 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-[#FF2B5E]" placeholder="••••••••" required />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button disabled={probando} className="w-full bg-[#FF2B5E] hover:bg-[#e0194a] disabled:opacity-60 text-white font-bold rounded-xl py-3 text-sm">
        {probando ? 'Verificando…' : 'Guardar'}
      </button>
    </form>
  );
}

/* ── Resultado: QR listo ────────────────────────────────────────────────── */
function Resultado({ codigo, onCerrar }) {
  const [copiado, setCopiado] = useState(false);
  const url = urlDelMomento(codigo);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch { /* nada */ }
  };
  return (
    <div className="bg-gray-800 rounded-2xl p-5 flex flex-col items-center gap-4 text-center">
      <p className="text-green-400 font-semibold flex items-center gap-2"><Check size={18} /> Momento creado</p>
      <img src={qrComoDataUrl(codigo)} alt={`QR ${codigo}`} className="w-56 rounded-xl bg-white" />
      <p className="text-white font-mono text-lg tracking-widest">{codigo}</p>
      <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
        <button onClick={() => descargarQR(codigo)} className="bg-[#FF2B5E] hover:bg-[#e0194a] text-white rounded-xl py-3 text-xs font-bold flex flex-col items-center gap-1"><Download size={18} /> QR</button>
        <button onClick={copiar} className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 text-xs font-bold flex flex-col items-center gap-1">{copiado ? <Check size={18} /> : <Copy size={18} />} {copiado ? 'Copiado' : 'Enlace'}</button>
        <a href={url} target="_blank" rel="noopener" className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 text-xs font-bold flex flex-col items-center gap-1"><ExternalLink size={18} /> Ver</a>
      </div>
      <button onClick={onCerrar} className="text-gray-400 hover:text-white text-sm flex items-center gap-1"><Plus size={14} /> Crear otro</button>
    </div>
  );
}

/* ── Formulario ─────────────────────────────────────────────────────────── */
function NuevoMomento({ clave, onCreado, onCancelar }) {
  const [foto, setFoto] = useState(null);            // { canvas, mind, puntos }
  const [previa, setPrevia] = useState('');
  const [preparando, setPreparando] = useState(0);   // 0 = no; >0 avance %
  const [errorFoto, setErrorFoto] = useState('');
  const [tipo, setTipo] = useState('fotos');
  const [fotos, setFotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [avisosVideo, setAvisosVideo] = useState([]);
  const [musicaId, setMusicaId] = useState('');
  const [musicaArchivo, setMusicaArchivo] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cliente, setCliente] = useState('');
  const [estado, setEstado] = useState(null);        // { texto, avance }
  const [error, setError] = useState('');
  const fotosRef = useRef([]);
  useEffect(() => { fotosRef.current = fotos; }, [fotos]);
  useEffect(() => () => fotosRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  const elegirFoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFoto(null); setErrorFoto(''); setPreparando(1);
    try {
      const r = await prepararFotoRegalo(file, (p) => setPreparando(Math.max(1, Math.round(p))));
      setPrevia(r.canvas.toDataURL('image/jpeg', 0.7));
      setFoto(r);
    } catch (err) {
      console.error(err);
      setErrorFoto('No se pudo preparar la foto: ' + err.message);
    } finally { setPreparando(0); }
  };

  const elegirFotos = (e) => {
    const lista = [...(e.target.files || [])];
    e.target.value = '';
    if (!lista.length) return;
    const nuevas = lista.slice(0, MAX_FOTOS - fotos.length).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setFotos((prev) => [...prev, ...nuevas]);
  };
  const quitarFoto = (i) => setFotos((prev) => {
    URL.revokeObjectURL(prev[i].url);
    return prev.filter((_, k) => k !== i);
  });

  const elegirVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setVideo(null); setAvisosVideo([]);
    if (!file) return;
    const info = await infoVideo(file);
    const avisos = [];
    let bloquea = false;
    if (!info) { avisos.push(['mal', 'No se puede leer este video. Conviértelo a MP4.']); bloquea = true; }
    if (file.size > 30 * MB) { avisos.push(['mal', `Pesa ${mb(file.size)}: máximo 30 MB.`]); bloquea = true; }
    else if (file.size > 8 * MB) avisos.push(['medio', `Pesa ${mb(file.size)}: tardará en cargar con datos. Ideal menos de 8 MB.`]);
    if (!/mp4$/i.test(file.type) && !/\.mp4$/i.test(file.name)) avisos.push(['medio', 'No es MP4: algunos celulares no lo reproducen.']);
    if (info && info.dur > 90) avisos.push(['medio', `Dura ${Math.round(info.dur)} s. Ideal menos de 60 s.`]);
    if (!avisos.length && info) avisos.push(['ok', `${mb(file.size)} · ${Math.round(info.dur)} s`]);
    setAvisosVideo(avisos);
    if (!bloquea) setVideo(file);
  };

  const elegirMusica = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMusicaArchivo(file); setMusicaId('');
  };

  const faltante = () => {
    if (preparando) return 'Preparando la foto…';
    if (!foto) return 'Falta la foto del regalo';
    if (tipo === 'fotos' && !fotos.length) return 'Faltan las fotos';
    if (tipo === 'video' && !video) return 'Falta el video';
    return '';
  };

  const crear = async () => {
    setError('');
    try {
      let musica = musicaArchivo;
      if (!musica && musicaId) {
        const c = MUSICA.find((m) => m.id === musicaId);
        const r = await fetch(encodeURI(c.archivo));
        if (!r.ok) throw new Error('No se pudo leer la canción');
        musica = await r.blob();
      }
      if (musica && musica.size > 15 * MB) throw new Error('La música pesa más de 15 MB');
      const { codigo } = await crearMomentoRA(clave, {
        foto, tipo, fotos: fotos.map((f) => f.file), video, musica,
        titulo: titulo.trim(), mensaje: mensaje.trim(), cliente: cliente.trim(),
      }, setEstado);
      onCreado(codigo);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setEstado(null);
    }
  };

  const q = foto ? calidad(foto.puntos) : null;
  const falta = faltante();
  const ocupado = !!estado;

  return (
    <div className="space-y-4">
      <Paso n={1} titulo="Foto del regalo" Icono={ImageIcon}>
        <p className="text-gray-400 text-xs">La foto impresa o la tarjeta a la que apuntarán con la cámara.</p>
        <div className="flex gap-3 items-center">
          <div className="w-24 h-24 rounded-xl bg-gray-900 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
            {previa ? <img src={previa} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-600" />}
          </div>
          <div className="flex-1 space-y-2">
            <BotonArchivo accept="image/*" onChange={elegirFoto} disabled={!!preparando || ocupado}>
              {preparando ? <><Loader2 size={16} className="animate-spin" /> {preparando}%</> : <><ImageIcon size={16} /> {foto ? 'Cambiar foto' : 'Elegir foto'}</>}
            </BotonArchivo>
            {q && (
              <p className={`text-xs rounded-lg px-3 py-2 ${COLOR_NIVEL[q.nivel]}`}>
                <b>{q.titulo}</b> · {q.texto}
              </p>
            )}
          </div>
        </div>
        {preparando > 0 && (
          <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden"><div className="h-full bg-[#FF2B5E] transition-all" style={{ width: `${preparando}%` }} /></div>
        )}
        {errorFoto && <p className="text-red-400 text-xs">{errorFoto}</p>}
      </Paso>

      <Paso n={2} titulo="Qué aparece" Icono={Sparkles}>
        <div className="grid grid-cols-2 gap-2 bg-gray-900 rounded-xl p-1">
          {[['fotos', 'Fotos', Images], ['video', 'Video', Video]].map(([k, t, I]) => (
            <button key={k} type="button" onClick={() => setTipo(k)}
              className={`rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 transition ${tipo === k ? 'bg-[#FF2B5E] text-white' : 'text-gray-400 hover:text-white'}`}>
              <I size={16} /> {t}
            </button>
          ))}
        </div>
        {tipo === 'fotos' ? (
          <>
            {fotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {fotos.map(({ url: u }, i) => (
                  <div key={u} className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
                    <img src={u} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => quitarFoto(i)} aria-label="Quitar"
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
            {fotos.length < MAX_FOTOS && (
              <BotonArchivo accept="image/*" multiple onChange={elegirFotos} disabled={ocupado}>
                <Plus size={16} /> Agregar fotos <span className="text-gray-400">({fotos.length}/{MAX_FOTOS})</span>
              </BotonArchivo>
            )}
          </>
        ) : (
          <>
            <BotonArchivo accept="video/mp4,video/*" onChange={elegirVideo} disabled={ocupado}>
              <Video size={16} /> {video ? 'Cambiar video' : 'Elegir video'}
            </BotonArchivo>
            {avisosVideo.map(([n, t]) => <p key={t} className={`text-xs rounded-lg px-3 py-2 ${COLOR_NIVEL[n]}`}>{t}</p>)}
          </>
        )}
      </Paso>

      <Paso n={3} titulo="Música (opcional)" Icono={Music}>
        <select value={musicaArchivo ? '__archivo' : musicaId}
          onChange={(e) => { if (e.target.value !== '__archivo') { setMusicaId(e.target.value); setMusicaArchivo(null); } }}
          className="w-full bg-gray-900 rounded-xl px-4 py-3 text-white text-sm outline-none">
          <option value="">Sin música</option>
          {MUSICA.map((m) => <option key={m.id} value={m.id}>{m.titulo}</option>)}
          {musicaArchivo && <option value="__archivo">{musicaArchivo.name}</option>}
        </select>
        <BotonArchivo accept=".mp3,audio/mpeg" onChange={elegirMusica} disabled={ocupado}>
          <Music size={16} /> Subir otro MP3
        </BotonArchivo>
      </Paso>

      <Paso n={4} titulo="Textos" Icono={Type}>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120} placeholder="Título (ej. Feliz aniversario)"
          className="w-full bg-gray-900 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-[#FF2B5E]" />
        <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={400} rows={2} placeholder="Mensaje"
          className="w-full bg-gray-900 rounded-xl px-4 py-3 text-white text-sm outline-none resize-none focus:ring-2 focus:ring-[#FF2B5E]" />
        <input value={cliente} onChange={(e) => setCliente(e.target.value)} maxLength={120} placeholder="Cliente (solo lo ves tú)"
          className="w-full bg-gray-900 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-[#FF2B5E]" />
      </Paso>

      {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">{error}</p>}

      {estado ? (
        <div className="bg-gray-800 rounded-2xl p-4 space-y-2">
          <p className="text-white text-sm flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {estado.texto}</p>
          <div className="h-2 bg-gray-900 rounded-full overflow-hidden"><div className="h-full bg-[#FF2B5E] transition-all" style={{ width: `${Math.round(estado.avance * 100)}%` }} /></div>
          <p className="text-gray-500 text-xs">No cierres esta pantalla.</p>
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 text-sm">Cancelar</button>
          <button onClick={crear} disabled={!!falta}
            className="flex-[2] bg-[#FF2B5E] hover:bg-[#e0194a] disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm flex items-center justify-center gap-2">
            <QrCode size={16} /> {falta || 'Crear momento'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Principal ──────────────────────────────────────────────────────────── */
export default function AdminMomentosRA() {
  const [clave, setClave] = useState(leerClave);
  const [momentos, setMomentos] = useState([]);
  const [cargando, setCargando] = useState(() => !!leerClave());
  const [error, setError] = useState('');
  const [vista, setVista] = useState('lista');       // lista | nuevo | listo
  const [creado, setCreado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [borrando, setBorrando] = useState(null);

  const traer = (c, sigueVivo = () => true) =>
    listarMomentos(c)
      .then((lista) => { if (sigueVivo()) { setMomentos(lista); setError(''); } })
      .catch((err) => {
        if (!sigueVivo()) return;
        if (err.status === 401) { borrarClave(); setClave(''); }
        setError(err.message);
      })
      .finally(() => { if (sigueVivo()) setCargando(false); });

  const cargar = () => { if (clave) { setCargando(true); traer(clave); } };

  useEffect(() => {
    if (!clave) return undefined;
    let vivo = true;
    traer(clave, () => vivo);
    return () => { vivo = false; };
  }, [clave]);

  const eliminar = async (codigo) => {
    try { await eliminarMomentoRA(clave, codigo); setBorrando(null); cargar(); }
    catch (err) { setError(err.message); setBorrando(null); }
  };

  const filtrados = momentos.filter((m) =>
    [m.codigo, m.titulo, m.cliente].join(' ').toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-white font-semibold text-xl flex items-center gap-2">
          <Sparkles size={20} className="text-[#FF2B5E]" /> Momentos RA
          {clave && <span className="text-gray-500 text-sm font-normal">({momentos.length})</span>}
        </h2>
        {clave && vista === 'lista' && (
          <button onClick={() => setVista('nuevo')} className="flex items-center gap-2 bg-[#FF2B5E] hover:bg-[#e0194a] text-white rounded-xl px-4 py-2.5 text-sm font-bold">
            <Plus size={16} /> Nuevo
          </button>
        )}
      </div>

      {!clave ? (
        <PedirClave onLista={(c) => { setCargando(true); setClave(c); }} />
      ) : vista === 'nuevo' ? (
        <NuevoMomento clave={clave}
          onCancelar={() => setVista('lista')}
          onCreado={(c) => { setCreado(c); setVista('listo'); cargar(); }} />
      ) : vista === 'listo' ? (
        <>
          <Resultado codigo={creado} onCerrar={() => setVista('nuevo')} />
          <button onClick={() => setVista('lista')} className="text-gray-400 hover:text-white text-sm">← Ver todos</button>
        </>
      ) : (
        <>
          {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">{error}</p>}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar código, título o cliente"
                className="w-full bg-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm outline-none" />
            </div>
            <button onClick={() => cargar()} aria-label="Actualizar" className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl px-3">
              <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="space-y-2">
            {!cargando && filtrados.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-10">Aún no hay momentos. Toca «Nuevo».</p>
            )}
            {filtrados.map((m) => (
              <div key={m.codigo} className="bg-gray-800 rounded-2xl p-3 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 text-gray-400">
                  {m.tipo === 'video' ? <Video size={18} /> : <Images size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{m.titulo || 'Sin título'}</p>
                  <p className="text-gray-500 text-xs truncate"><span className="font-mono text-gray-400">{m.codigo}</span>{m.cliente && ` · ${m.cliente}`} · {m.creado}</p>
                </div>
                <button onClick={() => descargarQR(m.codigo)} aria-label="Descargar QR" className="p-2 text-gray-300 hover:text-white"><QrCode size={18} /></button>
                <a href={urlDelMomento(m.codigo)} target="_blank" rel="noopener" aria-label="Ver" className="p-2 text-gray-300 hover:text-white"><ExternalLink size={18} /></a>
                <button onClick={() => setBorrando(m)} aria-label="Eliminar" className="p-2 text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>

          <button onClick={() => { borrarClave(); setClave(''); setMomentos([]); }} className="text-gray-500 hover:text-gray-300 text-xs flex items-center gap-1">
            <KeyRound size={12} /> Cambiar clave de subida
          </button>
        </>
      )}

      {borrando && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="text-white font-semibold mb-2">¿Eliminar {borrando.codigo}?</p>
            <p className="text-gray-400 text-sm mb-5">El QR dejará de funcionar. No se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setBorrando(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-2.5 text-sm">Cancelar</button>
              <button onClick={() => eliminar(borrando.codigo)} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
