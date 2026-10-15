import { useState, useEffect } from 'react';
import {
  Search, CheckCircle2, Clock, Package, Phone, User, FileText, Heart,
  Truck, Trash2, Edit2, Eye, X, Save, ChevronDown,
  DollarSign, MapPin, Send,
} from 'lucide-react';
import { subscribeVentas, actualizarVenta, eliminarVenta } from '../../adminFirebase';

const ESTADOS = ['pendiente', 'haciendo', 'terminada', 'cancelada'];
const estadoStyle = {
  pendiente:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  haciendo:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  terminada:  'bg-green-500/20 text-green-400 border-green-500/30',
  cancelada:  'bg-red-500/20 text-red-400 border-red-500/30',
};

function formatFecha(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

/* ── Modal Detalle ────────────────────────────────────────────────────────── */
function ModalDetalle({ venta, onCerrar }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gray-900 px-6 pt-5 pb-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-yellow-400 font-mono font-bold text-lg">{venta.idPedido || venta.id?.slice(-8)?.toUpperCase() || '—'}</p>
            <p className="text-gray-400 text-sm">{formatFecha(venta.fecha)}</p>
          </div>
          <button onClick={onCerrar} className="p-2 text-gray-400 hover:text-white"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Productos */}
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Productos</p>
            <div className="space-y-2">
              {(venta.items || [{ nombre: venta.producto?.nombre, precio: venta.total, cantidad: 1 }]).map((it, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                  {it.imagen ? <img src={it.imagen} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"/> : <div className="w-10 h-10 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center"><Package size={16} className="text-gray-500"/></div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{it.nombre}</p>
                    <p className="text-gray-400 text-xs">{it.cantidad}x S/{Number(it.precio).toFixed(2)}</p>
                  </div>
                  <p className="text-green-400 font-semibold text-sm">S/{(Number(it.precio) * it.cantidad).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
            {venta.subtotal > 0 && venta.delivery?.incluye && (
              <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>S/{Number(venta.subtotal).toFixed(2)}</span></div>
            )}
            {venta.delivery?.incluye && (
              <div className="flex justify-between text-gray-400"><span>🚚 Delivery</span><span>S/{Number(venta.delivery.precio).toFixed(2)}</span></div>
            )}
            <div className="flex justify-between text-white font-bold border-t border-gray-700 pt-2"><span>Total</span><span className="text-green-400 text-base">S/{Number(venta.total).toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400"><span>Adelanto</span><span className="text-blue-400">S/{Number(venta.adelanto || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400"><span>Falta</span><span className="text-orange-400">S/{Math.max(0, Number(venta.total) - Number(venta.adelanto || 0)).toFixed(2)}</span></div>
          </div>

          {/* Info cliente */}
          {(venta.cliente || venta.telefono || venta.direccion) && (
            <div className="space-y-2">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Cliente</p>
              {venta.cliente && <div className="flex items-center gap-2 text-gray-200 text-sm"><User size={14} className="text-gray-500"/>{venta.cliente}</div>}
              {venta.telefono && <div className="flex items-center gap-2 text-gray-200 text-sm"><Phone size={14} className="text-gray-500"/><a href={`tel:${venta.telefono}`} className="hover:text-blue-400">{venta.telefono}</a></div>}
              {venta.direccion && <div className="flex items-center gap-2 text-gray-200 text-sm"><MapPin size={14} className="text-gray-500"/>{venta.direccion}</div>}
            </div>
          )}

          {/* Dedicatoria */}
          {(venta.dedicatoria?.de || venta.dedicatoria?.para || venta.dedicatoria?.mensaje) && (
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4 space-y-1.5">
              <p className="flex items-center gap-1 text-pink-300 text-xs font-semibold"><Heart size={12}/> DEDICATORIA</p>
              {venta.dedicatoria.de && <p className="text-gray-300 text-sm">De: <span className="text-white">{venta.dedicatoria.de}</span></p>}
              {venta.dedicatoria.para && <p className="text-gray-300 text-sm">Para: <span className="text-white">{venta.dedicatoria.para}</span></p>}
              {venta.dedicatoria.mensaje && <p className="text-white text-sm italic">"{venta.dedicatoria.mensaje}"</p>}
            </div>
          )}

          {/* Notas */}
          {venta.notas && (
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Notas</p>
              <p className="text-gray-200 text-sm bg-gray-800 rounded-xl px-4 py-3">{venta.notas}</p>
            </div>
          )}

          {venta.vendedor && <p className="text-gray-500 text-xs">Registrado por: {venta.vendedor}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Modal Editar ─────────────────────────────────────────────────────────── */
function ModalEditar({ venta, onCerrar, onGuardado }) {
  const [form, setForm] = useState({
    cliente: venta.cliente || '',
    telefono: venta.telefono || '',
    direccion: venta.direccion || '',
    notas: venta.notas || '',
    adelanto: venta.adelanto || 0,
    estado: venta.estado || 'pendiente',
    entregado: !!venta.entregado,
  });
  const [guardando, setGuardando] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    setGuardando(true);
    try {
      await actualizarVenta(venta.id, form);
      onGuardado();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 pt-5 pb-4 border-b border-gray-800 flex items-center justify-between">
          <p className="text-white font-bold">Editar {venta.idPedido || venta.id?.slice(-8)?.toUpperCase() || 'Pedido'}</p>
          <button onClick={onCerrar} className="p-2 text-gray-400 hover:text-white"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Cliente</label>
              <input value={form.cliente} onChange={e => set('cliente', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"/>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Teléfono</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"/>
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Dirección</label>
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Adelanto (S/)</label>
              <input type="number" min="0" value={form.adelanto} onChange={e => set('adelanto', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"/>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Estado</label>
              <select value={form.estado} onChange={e => set('estado', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500">
                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500 resize-none"/>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => set('entregado', !form.entregado)}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.entregado ? 'bg-green-600' : 'bg-gray-600'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.entregado ? 'translate-x-5' : 'translate-x-0.5'}`}/>
            </div>
            <span className="text-gray-300 text-sm">Marcado como entregado</span>
          </label>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onCerrar} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-2.5 text-sm font-medium">Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
            <Save size={14}/> {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Fila de la tabla ─────────────────────────────────────────────────────── */
function FilaVenta({ venta, onVerDetalle, onEditar, onEliminar }) {
  const [marcandoPago, setMarcandoPago] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const total = Number(venta.total || 0);
  const adelanto = Number(venta.adelanto || 0);
  const falta = Math.max(0, total - adelanto);
  const pagado = falta === 0 && total > 0;

  const marcarPagado = async () => {
    setMarcandoPago(true);
    try { await actualizarVenta(venta.id, { adelanto: total }); }
    finally { setMarcandoPago(false); }
  };

  const toggleEntregado = async () => {
    const nuevo = !venta.entregado;
    await actualizarVenta(venta.id, { entregado: nuevo, estado: nuevo ? 'terminada' : 'pendiente' });
  };

  const cambiarEstado = async (nuevoEstado) => {
    await actualizarVenta(venta.id, { estado: nuevoEstado });
    setCambiandoEstado(false);
  };

  // Productos en texto breve
  const productosTexto = (venta.items || []).length > 0
    ? venta.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')
    : venta.producto?.nombre || '—';

  return (
    <tr className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${venta.entregado ? 'opacity-75' : ''}`}>
      {/* ID + Fecha */}
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-yellow-400 font-mono font-bold text-sm">{venta.idPedido || venta.id?.slice(-8)?.toUpperCase() || '—'}</p>
        <p className="text-gray-500 text-xs mt-0.5">{formatFecha(venta.fecha)}</p>
        {venta.cliente && <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[120px]">{venta.cliente}</p>}
      </td>

      {/* Productos */}
      <td className="px-4 py-3">
        <p className="text-white text-sm line-clamp-2 max-w-[200px]">{productosTexto}</p>
      </td>

      {/* Pagos / Total */}
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-white font-bold text-sm">S/{total.toFixed(2)}</p>
        <p className="text-green-400 text-xs">Adelanto: S/{adelanto.toFixed(2)}</p>
        <p className="text-orange-400 text-xs">Falta: S/{falta.toFixed(2)}</p>
        {!pagado && (
          <button onClick={marcarPagado} disabled={marcandoPago}
            className="mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium">
            {marcandoPago ? '...' : 'Marcar Pagado'}
          </button>
        )}
        {pagado && <span className="mt-1 inline-block px-2 py-0.5 bg-green-500/20 text-green-400 rounded-lg text-xs">✓ Pagado</span>}
      </td>

      {/* Estado */}
      <td className="px-4 py-3 whitespace-nowrap relative">
        <button onClick={() => setCambiandoEstado(!cambiandoEstado)}
          className={`px-2.5 py-1 rounded-lg text-xs border font-medium flex items-center gap-1 ${estadoStyle[venta.estado] || estadoStyle.pendiente}`}>
          {venta.estado || 'pendiente'} <ChevronDown size={10}/>
        </button>
        {cambiandoEstado && (
          <div className="absolute z-20 top-10 left-4 bg-gray-800 border border-gray-700 rounded-xl shadow-xl min-w-[140px] overflow-hidden">
            {ESTADOS.map(s => (
              <button key={s} onClick={() => cambiarEstado(s)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${venta.estado === s ? 'text-white font-semibold' : 'text-gray-300'}`}>
                {s}
              </button>
            ))}
            <button onClick={() => setCambiandoEstado(false)} className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-700 border-t border-gray-700">Cancelar</button>
          </div>
        )}
      </td>

      {/* Entregado */}
      <td className="px-4 py-3 whitespace-nowrap">
        <button onClick={toggleEntregado}
          className={`p-2 rounded-xl transition-all ${venta.entregado ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400 hover:text-green-400'}`}
          title={venta.entregado ? 'Entregado ✓' : 'Marcar entregado'}>
          {venta.entregado ? <CheckCircle2 size={18}/> : <Truck size={18}/>}
        </button>
      </td>

      {/* Acciones */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <button onClick={() => onVerDetalle(venta)} title="Ver detalle"
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors">
            <Eye size={14}/>
          </button>
          <button onClick={() => onEditar(venta)} title="Editar"
            className="p-2 rounded-lg bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white transition-colors">
            <Edit2 size={14}/>
          </button>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} title="Eliminar"
              className="p-2 rounded-lg bg-gray-700 hover:bg-red-600/30 text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 size={14}/>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => onEliminar(venta.id)} className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"><Trash2 size={14}/></button>
              <button onClick={() => setConfirmDelete(false)} className="p-2 rounded-lg bg-gray-600 text-white text-xs">✕</button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ── Componente principal ─────────────────────────────────────────────────── */
export default function AdminHistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroEntrega, setFiltroEntrega] = useState('todos');
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [ventaEditar, setVentaEditar] = useState(null);

  useEffect(() => subscribeVentas(setVentas), []);

  const eliminarPedido = (id) => eliminarVenta(id);

  const filtradas = ventas.filter(v => {
    const matchBusqueda = !busqueda || [v.idPedido, v.cliente, v.telefono,
      ...(v.items || []).map(i => i.nombre), v.producto?.nombre
    ].some(s => s?.toLowerCase?.().includes(busqueda.toLowerCase()));
    const matchEstado = filtroEstado === 'todos' || v.estado === filtroEstado;
    const matchEntrega = filtroEntrega === 'todos' ? true : filtroEntrega === 'entregado' ? !!v.entregado : !v.entregado;
    return matchBusqueda && matchEstado && matchEntrega;
  });

  const stats = {
    total: ventas.length,
    entregados: ventas.filter(v => v.entregado).length,
    pendientes: ventas.filter(v => !v.entregado).length,
    ingresos: ventas.reduce((s, v) => s + Number(v.adelanto || 0), 0),
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-2xl font-bold">Historial de Ventas</h2>
        <p className="text-gray-400 text-sm">{ventas.length} pedidos registrados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p><p className="text-gray-400 text-xs">Total</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.entregados}</p><p className="text-gray-400 text-xs">Entregados</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats.pendientes}</p><p className="text-gray-400 text-xs">Pendientes</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-blue-400">S/{stats.ingresos.toFixed(0)}</p><p className="text-gray-400 text-xs">Cobrado</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar ID, cliente, producto..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-white text-sm outline-none focus:border-blue-500"/>
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none">
          <option value="todos">Todos los estados</option>
          {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtroEntrega} onChange={e => setFiltroEntrega(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none">
          <option value="todos">Entrega: todos</option>
          <option value="entregado">Entregados</option>
          <option value="pendiente">Pendientes</option>
        </select>
      </div>

      {/* Tabla */}
      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Package size={48} className="mx-auto mb-3 opacity-30"/>
          <p>No hay ventas{busqueda ? ` para "${busqueda}"` : ''}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-800/80 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-4 py-3 text-left">ID Pedido</th>
                <th className="px-4 py-3 text-left">Productos Vendidos</th>
                <th className="px-4 py-3 text-left">Pagos / Total</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Entregado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(v => (
                <FilaVenta key={v.id} venta={v}
                  onVerDetalle={setVentaDetalle}
                  onEditar={setVentaEditar}
                  onEliminar={eliminarPedido}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      {ventaDetalle && <ModalDetalle venta={ventaDetalle} onCerrar={() => setVentaDetalle(null)}/>}
      {ventaEditar && <ModalEditar venta={ventaEditar} onCerrar={() => setVentaEditar(null)} onGuardado={() => setVentaEditar(null)}/>}
    </div>
  );
}
