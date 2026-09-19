// ---------------------------------------------------------------------------
// Pestaña "Momentos" del admin: aquí creas los álbumes que abre el QR.
//
// Dos formas de trabajar, las dos conviven:
//   1. Generas un lote de códigos en blanco, imprimes las tarjetas y las tienes
//      listas. Cuando alguien compra, buscas ese código y le cargas el pedido.
//   2. Creas el momento con todo y descargas su QR en el momento.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { MUSICA } from '../musica';
import {
  MAX_FOTOS,
  asignarMomento,
  crearLote,
  crearMomento,
  eliminarMomento,
  guardarFotos,
  liberarMomento,
  obtenerMomento,
  suscribirMomentos,
  urlDelMomento,
} from '../recuerdos';

const VACIO = { pedido: '', nombre: '', deParte: '', dedicatoria: '', cancion: '' };

const fecha = (ts) => {
  const d = ts?.toDate ? ts.toDate() : null;
  return d ? d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
};

const ESTILO_IMPRESION = `
@media print{
  body *{visibility:hidden !important}
  #hoja-qr, #hoja-qr *{visibility:visible !important}
  #hoja-qr{position:absolute;inset:0;display:grid !important;
    grid-template-columns:repeat(2,1fr);gap:0;padding:6mm}
  .tarjeta-qr{break-inside:avoid;border:1px dashed #cbd5e1;padding:8mm 6mm;text-align:center}
}
`;

export default function AdminRecuerdos() {
  const [momentos, setMomentos] = useState([]);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [seleccion, setSeleccion] = useState([]);
  const [editando, setEditando] = useState(null);   // código
  const [form, setForm] = useState(VACIO);
  const [fotos, setFotos] = useState([]);           // File[]
  const [previas, setPrevias] = useState([]);       // dataURL[] ya guardadas
  const [ocupado, setOcupado] = useState('');
  const [qrs, setQrs] = useState({});               // { codigo: dataURL }
  const [cantidadLote, setCantidadLote] = useState(10);
  const archivoRef = useRef(null);

  useEffect(() => suscribirMomentos(
    (lista) => { setMomentos(lista); setCargado(true); },
    (e) => { setError(e.message); setCargado(true); }
  ), []);

  // QR de todos los códigos visibles (se calcula una sola vez por código)
  useEffect(() => {
    const faltan = momentos.filter((m) => !qrs[m.id]);
    if (!faltan.length) return;
    let vivo = true;
    Promise.all(faltan.map(async (m) => [
      m.id,
      await QRCode.toDataURL(urlDelMomento(m.id), { margin: 1, width: 560, errorCorrectionLevel: 'Q' }),
    ])).then((pares) => {
      if (!vivo) return;
      setQrs((antes) => ({ ...antes, ...Object.fromEntries(pares) }));
    });
    return () => { vivo = false; };
  }, [momentos, qrs]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return momentos.filter((m) => {
      if (filtro === 'libres' && m.estado !== 'libre') return false;
      if (filtro === 'listos' && m.estado !== 'listo') return false;
      if (!q) return true;
      return [m.id, m.nombre, m.pedido, m.deParte].some((v) =>
        String(v || '').toLowerCase().includes(q));
    });
  }, [momentos, filtro, busqueda]);

  const conteo = useMemo(() => ({
    libres: momentos.filter((m) => m.estado === 'libre').length,
    listos: momentos.filter((m) => m.estado === 'listo').length,
  }), [momentos]);

  // --- acciones -------------------------------------------------------------
  const generarLote = async () => {
    const n = Math.max(1, Math.min(60, Number(cantidadLote) || 1));
    setOcupado(`Generando ${n} código(s)…`);
    try {
      const nuevos = await crearLote(n);
      setSeleccion(nuevos);
      setFiltro('libres');
    } catch (e) { setError(e.message); }
    setOcupado('');
  };

  const nuevoMomento = async () => {
    setOcupado('Creando…');
    try {
      const codigo = await crearMomento({});
      abrirEditor({ id: codigo, ...VACIO });
    } catch (e) { setError(e.message); }
    setOcupado('');
  };

  const abrirEditor = async (m) => {
    setEditando(m.id);
    setForm({
      pedido: m.pedido || '', nombre: m.nombre || '', deParte: m.deParte || '',
      dedicatoria: m.dedicatoria || '', cancion: m.cancion || (MUSICA[0]?.id ?? ''),
    });
    setFotos([]);
    setPrevias([]);
    if (m.fotos) {
      const lleno = await obtenerMomento(m.id);
      setPrevias(lleno?.fotos || []);
    }
  };

  const cerrarEditor = () => { setEditando(null); setForm(VACIO); setFotos([]); setPrevias([]); };

  const elegirFotos = (e) => {
    const lista = Array.from(e.target.files || []).slice(0, MAX_FOTOS);
    setFotos(lista);
    setPrevias(lista.map((f) => URL.createObjectURL(f)));
  };

  const guardar = async () => {
    if (!editando) return;
    if (!form.nombre.trim()) { setError('Falta el nombre de quien recibe el álbum.'); return; }
    if (!previas.length && !fotos.length) { setError(`Faltan las ${MAX_FOTOS} fotos.`); return; }
    setError(null);
    try {
      setOcupado('Guardando el pedido…');
      await asignarMomento(editando, form);
      if (fotos.length) {
        await guardarFotos(editando, fotos, (hechas, total) =>
          setOcupado(`Subiendo fotos… ${hechas} de ${total}`));
      }
      setOcupado('');
      cerrarEditor();
    } catch (e) {
      setOcupado('');
      setError(e.message);
    }
  };

  const copiarLink = async (codigo) => {
    try { await navigator.clipboard.writeText(urlDelMomento(codigo)); setOcupado('Link copiado ✓'); }
    catch { setOcupado(urlDelMomento(codigo)); }
    setTimeout(() => setOcupado(''), 1600);
  };

  const descargarQR = (codigo) => {
    const a = document.createElement('a');
    a.href = qrs[codigo];
    a.download = `qr-momento-${codigo}.png`;
    a.click();
  };

  const alternar = (codigo) =>
    setSeleccion((s) => s.includes(codigo) ? s.filter((c) => c !== codigo) : [...s, codigo]);

  const paraImprimir = seleccion.length
    ? momentos.filter((m) => seleccion.includes(m.id))
    : visibles;

  // --- pantalla -------------------------------------------------------------
  return (
    <div className="space-y-6">
      <style>{ESTILO_IMPRESION}</style>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-end gap-4">
        <div>
          <p className="font-bold text-gray-900">Momentos con QR</p>
          <p className="text-sm text-gray-500">
            {cargado ? `${conteo.libres} libres · ${conteo.listos} entregados` : 'Cargando…'}
          </p>
        </div>

        <div className="flex items-end gap-2 ml-auto">
          <label className="text-sm">
            <span className="block text-xs font-bold text-gray-500 mb-1">Códigos en blanco</span>
            <input type="number" min="1" max="60" value={cantidadLote}
                   onChange={(e) => setCantidadLote(e.target.value)}
                   className="w-24 px-3 py-2 border border-gray-200 rounded-xl" />
          </label>
          <button onClick={generarLote}
                  className="px-5 py-2.5 font-bold rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
            Generar lote
          </button>
          <button onClick={nuevoMomento}
                  className="px-5 py-2.5 font-bold rounded-xl bg-rose-500 text-white shadow-md hover:bg-rose-600">
            Nuevo momento
          </button>
          <button onClick={() => window.print()}
                  className="px-5 py-2.5 font-bold rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
            Imprimir tarjetas ({paraImprimir.length})
          </button>
        </div>
      </div>

      {(ocupado || error) && (
        <div className={`rounded-2xl p-4 text-sm font-medium ${error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          {error || ocupado}
          {error && (
            <button onClick={() => setError(null)} className="ml-3 underline">cerrar</button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {[['todos', 'Todos'], ['libres', 'Libres'], ['listos', 'Entregados']].map(([id, texto]) => (
          <button key={id} onClick={() => setFiltro(id)}
                  className={`px-4 py-2 font-bold rounded-xl text-sm transition ${filtro === id ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {texto}
          </button>
        ))}
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
               placeholder="Buscar por código, nombre o pedido"
               className="ml-auto px-4 py-2 border border-gray-200 rounded-xl w-full sm:w-72" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((m) => (
          <div key={m.id}
               className={`bg-white border rounded-2xl p-4 flex gap-4 ${seleccion.includes(m.id) ? 'border-rose-400 ring-2 ring-rose-100' : 'border-gray-200'}`}>
            <div className="flex-none">
              {qrs[m.id]
                ? <img src={qrs[m.id]} alt={`QR ${m.id}`} className="w-24 h-24 rounded-lg border border-gray-100" />
                : <div className="w-24 h-24 rounded-lg bg-gray-100 animate-pulse" />}
              <label className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                <input type="checkbox" checked={seleccion.includes(m.id)} onChange={() => alternar(m.id)} />
                imprimir
              </label>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg tracking-widest">{m.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.estado === 'listo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {m.estado === 'listo' ? 'ENTREGADO' : 'LIBRE'}
                </span>
              </div>
              <p className="text-sm text-gray-900 truncate">{m.nombre || <span className="text-gray-400">sin asignar</span>}</p>
              <p className="text-xs text-gray-500 truncate">{m.pedido || '—'} · {fecha(m.creado)}</p>

              <div className="flex flex-wrap gap-1.5 mt-3 text-xs">
                <button onClick={() => abrirEditor(m)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500 text-white font-bold">
                  {m.estado === 'listo' ? 'Editar' : 'Cargar pedido'}
                </button>
                <button onClick={() => copiarLink(m.id)} className="px-3 py-1.5 rounded-lg border border-gray-200">Copiar link</button>
                <button onClick={() => descargarQR(m.id)} className="px-3 py-1.5 rounded-lg border border-gray-200">QR</button>
                <a href={`/momento/${m.id}`} target="_blank" rel="noopener noreferrer"
                   className="px-3 py-1.5 rounded-lg border border-gray-200">Ver</a>
              </div>
            </div>
          </div>
        ))}

        {cargado && !visibles.length && (
          <p className="text-gray-500 col-span-full py-12 text-center">
            Todavía no hay momentos. Genera un lote de códigos para empezar.
          </p>
        )}
      </div>

      {/* ----- editor ----- */}
      {editando && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6"
             onClick={cerrarEditor}>
          <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Momento</p>
                <p className="font-mono font-bold text-2xl tracking-widest">{editando}</p>
              </div>
              {qrs[editando] && <img src={qrs[editando]} alt="" className="w-20 h-20" />}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="block text-xs font-bold text-gray-500 mb-1">N.° de pedido o nota interna</span>
                <input value={form.pedido} onChange={(e) => setForm({ ...form, pedido: e.target.value })}
                       placeholder="Pedido 128 · ramo girasoles"
                       className="w-full px-3 py-2 border border-gray-200 rounded-xl" />
              </label>
              <label className="text-sm">
                <span className="block text-xs font-bold text-gray-500 mb-1">Nombre que aparece en el álbum</span>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                       placeholder="Valeria"
                       className="w-full px-3 py-2 border border-gray-200 rounded-xl" />
              </label>
              <label className="text-sm">
                <span className="block text-xs font-bold text-gray-500 mb-1">De parte de (opcional)</span>
                <input value={form.deParte} onChange={(e) => setForm({ ...form, deParte: e.target.value })}
                       placeholder="Andrés"
                       className="w-full px-3 py-2 border border-gray-200 rounded-xl" />
              </label>
              <label className="text-sm">
                <span className="block text-xs font-bold text-gray-500 mb-1">Canción</span>
                <select value={form.cancion} onChange={(e) => setForm({ ...form, cancion: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white">
                  <option value="">Sin música</option>
                  {MUSICA.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="block text-xs font-bold text-gray-500 mb-1">Dedicatoria</span>
                <textarea rows="2" value={form.dedicatoria}
                          onChange={(e) => setForm({ ...form, dedicatoria: e.target.value })}
                          placeholder="Gracias por tanto. Que nunca te falten flores amarillas."
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl" />
              </label>
            </div>

            <div className="mt-5">
              <p className="text-xs font-bold text-gray-500 mb-2">
                LAS {MAX_FOTOS} FOTOS {previas.length ? `· ${previas.length} cargadas` : ''}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: MAX_FOTOS }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-xl border border-dashed border-gray-300 overflow-hidden bg-gray-50 grid place-items-center">
                    {previas[i]
                      ? <img src={previas[i]} alt="" className="w-full h-full object-cover" />
                      : <span className="text-gray-400 text-sm">{i + 1}</span>}
                  </div>
                ))}
              </div>
              <input ref={archivoRef} type="file" accept="image/*" multiple hidden onChange={elegirFotos} />
              <button onClick={() => archivoRef.current?.click()}
                      className="mt-3 px-4 py-2 rounded-xl border border-gray-200 font-bold text-sm">
                {previas.length ? 'Cambiar fotos' : `Elegir las ${MAX_FOTOS} fotos`}
              </button>
              <p className="text-xs text-gray-400 mt-2">
                Se achican solas antes de subirlas, así el álbum abre rápido en el celular del cliente.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              <button onClick={guardar} disabled={!!ocupado}
                      className="px-6 py-2.5 font-bold rounded-xl bg-rose-500 text-white shadow-md disabled:opacity-50">
                {ocupado || 'Guardar y publicar'}
              </button>
              <button onClick={cerrarEditor} className="px-5 py-2.5 font-bold rounded-xl border border-gray-200">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!confirm('¿Vaciar este código? Se borran las fotos y queda libre otra vez.')) return;
                  await liberarMomento(editando); cerrarEditor();
                }}
                className="px-5 py-2.5 font-bold rounded-xl border border-amber-200 text-amber-700 ml-auto">
                Vaciar
              </button>
              <button
                onClick={async () => {
                  if (!confirm('¿Eliminar el código para siempre? El QR impreso dejará de funcionar.')) return;
                  await eliminarMomento(editando); cerrarEditor();
                }}
                className="px-5 py-2.5 font-bold rounded-xl border border-red-200 text-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----- hoja para imprimir ----- */}
      <div id="hoja-qr" style={{ display: 'none' }}>
        {paraImprimir.map((m) => (
          <div className="tarjeta-qr" key={m.id}>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '20px', margin: '0 0 2mm' }}>
              Flores amarillas
            </p>
            <p style={{ fontSize: '8px', letterSpacing: '.2em', margin: '0 0 4mm', color: '#555' }}>
              TU ÁLBUM DIGITAL
            </p>
            {qrs[m.id] && <img src={qrs[m.id]} alt="" style={{ width: '34mm', height: '34mm' }} />}
            <p style={{ fontSize: '9px', margin: '4mm 0 1mm' }}>
              Apunta la cámara de tu celular al código
            </p>
            <p style={{ fontSize: '8px', color: '#555', margin: 0 }}>
              y mantén presionada la maceta para que florezca
            </p>
            <p style={{ fontSize: '8px', margin: '4mm 0 0', color: '#888' }}>
              momentos365.com · {m.id}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
