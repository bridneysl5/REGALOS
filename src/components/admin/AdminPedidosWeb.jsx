import { useState, useEffect, useMemo } from 'react';
import { MessageCircle, ShoppingCart, HelpCircle, Users, Trash2, Globe } from 'lucide-react';
import { subscribePedidosWeb, actualizarPedidoWeb, eliminarPedidoWeb } from '../../adminFirebase';
import { useAhora } from './origenes';

// Lo que pasó con cada persona que tocó un botón de WhatsApp en la tienda.
const ESTADOS = [
  { value: 'nuevo',      label: 'Nuevo',        estilo: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'atendido',   label: 'Respondido',   estilo: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'vendido',    label: 'Compró',       estilo: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'descartado', label: 'No compró',    estilo: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
];
const ESTILO = Object.fromEntries(ESTADOS.map(e => [e.value, e.estilo]));
const ETIQUETA = Object.fromEntries(ESTADOS.map(e => [e.value, e.label]));

const TIPOS = {
  pedido:   { label: 'Pedido (carrito)', icon: ShoppingCart },
  consulta: { label: 'Consulta',         icon: HelpCircle },
  paquete:  { label: 'Paquete grupal',   icon: Users },
};

const aFecha = (ts) => (ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null);
const formatFecha = (ts) => {
  const d = aFecha(ts);
  if (!d) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
};
const DIA = 24 * 60 * 60 * 1000;

const Tile = ({ label, valor, sub }) => (
  <div className="bg-[#111827] rounded-2xl p-4 border border-white/10">
    <p className="text-gray-400 text-xs font-medium">{label}</p>
    <p className="text-white text-2xl font-bold">{valor}</p>
    {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
  </div>
);

export default function AdminPedidosWeb() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [rango, setRango] = useState(30);
  const ahora = useAhora();

  useEffect(() => subscribePedidosWeb(setPedidos, (e) => setError(e?.code === 'permission-denied'
    ? 'Sin permiso para leer pedidos_web. Publica las reglas de firestore.rules.'
    : 'No se pudieron cargar los pedidos.')), []);

  const enRango = useMemo(() => pedidos.filter(p => {
    const d = aFecha(p.creadoEn);
    return !d || d.getTime() >= ahora - rango * DIA;
  }), [pedidos, rango, ahora]);

  const resumen = useMemo(() => {
    const porOrigen = {};
    const porEstado = {};
    enRango.forEach(p => {
      porOrigen[p.origen || 'directo'] = (porOrigen[p.origen || 'directo'] || 0) + 1;
      porEstado[p.estado || 'nuevo'] = (porEstado[p.estado || 'nuevo'] || 0) + 1;
    });
    const total = enRango.length;
    const vendidos = porEstado.vendido || 0;
    const hoy = new Date(ahora).toDateString();
    return {
      total,
      hoy: pedidos.filter(p => aFecha(p.creadoEn)?.toDateString() === hoy).length,
      sinResponder: porEstado.nuevo || 0,
      conversion: total ? Math.round((vendidos / total) * 100) : 0,
      vendidos,
      origenes: Object.entries(porOrigen).sort((a, b) => b[1] - a[1]),
    };
  }, [enRango, pedidos, ahora]);

  const lista = filtro === 'todos' ? enRango : enRango.filter(p => (p.estado || 'nuevo') === filtro);

  const cambiarEstado = async (p, estado) => {
    try { await actualizarPedidoWeb(p.id, { estado }); }
    catch { setError('No se pudo actualizar.'); }
  };
  const borrar = async (p) => {
    if (!window.confirm('¿Borrar este registro?')) return;
    try { await eliminarPedidoWeb(p.id); }
    catch { setError('No se pudo borrar.'); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><MessageCircle size={22} /> Pedidos web</h1>
          <p className="text-gray-500 text-sm mt-1">Personas que tocaron un botón de WhatsApp en la tienda</p>
        </div>
        <select value={rango} onChange={e => setRango(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2">
          <option value={1}>Últimas 24 horas</option>
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
          <option value={3650}>Todo</option>
        </select>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Escribieron (periodo)" valor={resumen.total} />
        <Tile label="Hoy" valor={resumen.hoy} />
        <Tile label="Sin responder" valor={resumen.sinResponder} />
        <Tile label="Terminaron comprando" valor={`${resumen.conversion}%`} sub={`${resumen.vendidos} de ${resumen.total}`} />
      </div>

      {resumen.origenes.length > 0 && (
        <div className="bg-[#111827] rounded-2xl p-4 border border-white/10">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1"><Globe size={12} /> De dónde llegaron</p>
          <div className="space-y-2">
            {resumen.origenes.map(([origen, n]) => (
              <div key={origen} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-gray-300 capitalize truncate">{origen}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div className="h-2 bg-[#FF2B5E] rounded-full" style={{ width: `${(n / resumen.total) * 100}%` }} />
                </div>
                <span className="w-10 text-right text-white font-medium">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[{ value: 'todos', label: 'Todos' }, ...ESTADOS].map(e => (
          <button key={e.value} onClick={() => setFiltro(e.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filtro === e.value ? 'bg-[#FF2B5E] text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {e.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {lista.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">No hay registros en este periodo.</div>
        )}
        {lista.map(p => {
          const tipo = TIPOS[p.tipo] || TIPOS.consulta;
          const Icon = tipo.icon;
          const estado = p.estado || 'nuevo';
          return (
            <div key={p.id} className="bg-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Icon size={16} className="text-gray-400" />
                <span className="text-white text-sm font-medium">{tipo.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${ESTILO[estado]}`}>{ETIQUETA[estado] || estado}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300 capitalize">{p.origen || 'directo'}</span>
                <span className="ml-auto text-gray-500 text-xs">{formatFecha(p.creadoEn)}</span>
              </div>
              {p.items?.length > 0 && (
                <ul className="text-sm text-gray-300 space-y-0.5">
                  {p.items.map((it, i) => (
                    <li key={i}>• {it.cantidad}x {it.nombre}{it.precio ? ` — S/${(it.precio * it.cantidad).toFixed(2)}` : ''}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {p.total > 0 && <span className="text-green-400 font-semibold text-sm">S/{Number(p.total).toFixed(2)}</span>}
                {p.pagina && <span className="text-gray-500 text-xs truncate max-w-[240px]">desde {p.pagina}</span>}
                <div className="ml-auto flex items-center gap-2">
                  <select value={estado} onChange={e => cambiarEstado(p, e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white text-xs rounded-lg px-2 py-1">
                    {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                  <button onClick={() => borrar(p)} title="Borrar" className="text-red-400 hover:text-red-300 p-1"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-gray-600 text-xs">
        Nota: aquí se ve quién tocó el botón en la web. Lo que conversan en WhatsApp no se ve aquí; para eso hace falta
        conectar la API de WhatsApp Business (el bot que conversamos).
      </p>
    </div>
  );
}
