import { useState, useEffect } from 'react';
import { Search, CheckCircle2, Clock, Package, Phone, User, FileText, Heart, Truck, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { subscribeVentas, actualizarVenta, eliminarVenta } from '../../adminFirebase';

const estadoStyles = {
  pendiente:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'en proceso':'bg-blue-500/20 text-blue-400 border-blue-500/30',
  entregado:   'bg-green-500/20 text-green-400 border-green-500/30',
  cancelado:   'bg-red-500/20 text-red-400 border-red-500/30',
};

function formatFecha(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Tarjeta de venta ─────────────────────────────────────────────────────── */
function TarjetaVenta({ venta, onToggleEntregado, onEliminar }) {
  const [expandido, setExpandido] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  const toggleEntregado = async () => {
    setActualizando(true);
    try {
      const nuevoEstado = venta.entregado ? false : true;
      await onToggleEntregado(venta.id, nuevoEstado);
    } finally {
      setActualizando(false);
    }
  };

  const tieneDetalles = venta.cliente || venta.telefono || venta.notas ||
    venta.dedicatoria?.de || venta.dedicatoria?.para || venta.dedicatoria?.mensaje;

  return (
    <div className={`bg-gray-800 border rounded-xl overflow-hidden transition-all ${venta.entregado ? 'border-green-500/30' : 'border-gray-700'}`}>
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        {/* Imagen producto */}
        {venta.producto?.imagen
          ? <img src={venta.producto.imagen} alt={venta.producto.nombre} className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
          : <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0"><Package size={20} className="text-gray-500"/></div>
        }

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-yellow-400 font-mono text-xs font-bold">{venta.idPedido || '—'}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs border ${estadoStyles[venta.estado] || estadoStyles.pendiente}`}>
              {venta.estado || 'pendiente'}
            </span>
          </div>
          <p className="text-white font-medium text-sm truncate mt-0.5">{venta.producto?.nombre || 'Producto'}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-green-400 font-bold text-sm">S/{Number(venta.total || 0).toFixed(2)}</span>
            {venta.cliente && <span className="text-gray-400 text-xs truncate">{venta.cliente}</span>}
          </div>
          <p className="text-gray-500 text-xs mt-0.5">{formatFecha(venta.fecha)}</p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleEntregado}
            disabled={actualizando}
            title={venta.entregado ? 'Marcar pendiente' : 'Marcar como entregado'}
            className={`p-2 rounded-lg border transition-all ${
              venta.entregado
                ? 'bg-green-500/20 border-green-500/40 text-green-400'
                : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-green-500/50 hover:text-green-400'
            }`}>
            {venta.entregado ? <CheckCircle2 size={18}/> : <Truck size={18}/>}
          </button>
          {tieneDetalles && (
            <button onClick={() => setExpandido(!expandido)} className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-white">
              {expandido ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
            </button>
          )}
        </div>
      </div>

      {/* Detalle expandible */}
      {expandido && tieneDetalles && (
        <div className="border-t border-gray-700 px-4 pb-4 pt-3 space-y-2 text-sm">
          {venta.cliente && (
            <div className="flex items-center gap-2 text-gray-300">
              <User size={14} className="text-gray-500 flex-shrink-0"/>
              <span>{venta.cliente}</span>
            </div>
          )}
          {venta.telefono && (
            <div className="flex items-center gap-2 text-gray-300">
              <Phone size={14} className="text-gray-500 flex-shrink-0"/>
              <a href={`tel:${venta.telefono}`} className="hover:text-blue-400">{venta.telefono}</a>
            </div>
          )}
          {venta.notas && (
            <div className="flex items-start gap-2 text-gray-300">
              <FileText size={14} className="text-gray-500 flex-shrink-0 mt-0.5"/>
              <span>{venta.notas}</span>
            </div>
          )}
          {(venta.dedicatoria?.de || venta.dedicatoria?.para || venta.dedicatoria?.mensaje) && (
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3 space-y-1">
              <p className="flex items-center gap-1 text-pink-300 text-xs font-medium"><Heart size={12}/> Dedicatoria</p>
              {venta.dedicatoria.de && <p className="text-gray-300">De: <span className="text-white">{venta.dedicatoria.de}</span></p>}
              {venta.dedicatoria.para && <p className="text-gray-300">Para: <span className="text-white">{venta.dedicatoria.para}</span></p>}
              {venta.dedicatoria.mensaje && <p className="text-white italic">"{venta.dedicatoria.mensaje}"</p>}
            </div>
          )}
          {venta.vendedor && <p className="text-gray-500 text-xs">Registrado por: {venta.vendedor}</p>}
        </div>
      )}
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────────────────────── */
export default function AdminHistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEntrega, setFiltroEntrega] = useState('todos');

  useEffect(() => subscribeVentas(setVentas), []);

  const toggleEntregado = (id, entregado) =>
    actualizarVenta(id, { entregado, estado: entregado ? 'entregado' : 'pendiente' });

  const filtradas = ventas.filter(v => {
    const matchBusqueda = !busqueda || [
      v.idPedido, v.cliente, v.producto?.nombre, v.telefono
    ].some(s => s?.toLowerCase?.().includes(busqueda.toLowerCase()));
    const matchEntrega =
      filtroEntrega === 'todos' ? true :
      filtroEntrega === 'entregado' ? !!v.entregado :
      !v.entregado;
    return matchBusqueda && matchEntrega;
  });

  const totalEntregados = ventas.filter(v => v.entregado).length;
  const totalPendientes = ventas.filter(v => !v.entregado).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-white text-2xl font-bold">Historial de Ventas</h2>
        <p className="text-gray-400 text-sm">{ventas.length} pedidos en total</p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{ventas.length}</p>
          <p className="text-gray-400 text-xs mt-0.5">Total pedidos</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{totalEntregados}</p>
          <p className="text-gray-400 text-xs mt-0.5">Entregados</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{totalPendientes}</p>
          <p className="text-gray-400 text-xs mt-0.5">Pendientes</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por ID, cliente, producto..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"
        />
      </div>

      {/* Filtros entrega */}
      <div className="flex gap-2">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'pendiente', label: <span className="flex items-center gap-1"><Clock size={12}/> Pendientes</span> },
          { key: 'entregado', label: <span className="flex items-center gap-1"><CheckCircle2 size={12}/> Entregados</span> },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltroEntrega(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filtroEntrega === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Package size={48} className="mx-auto mb-3 opacity-30"/>
          <p>No hay ventas{busqueda ? ` para "${busqueda}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(v => (
            <TarjetaVenta
              key={v.id}
              venta={v}
              onToggleEntregado={toggleEntregado}
            />
          ))}
        </div>
      )}
    </div>
  );
}
