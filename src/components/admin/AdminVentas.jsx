import React, { useState, useEffect, useRef } from 'react';
import { Plus, Printer, Search, X, ShoppingBag, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { subscribeVentas, registrarVenta, actualizarVenta, eliminarVenta } from '../../adminFirebase';
import { subscribeProductosRegalos, desdeFirebase } from '../../productosFirebase';

const ESTADOS = ['pendiente', 'en proceso', 'entregado', 'cancelado'];

const estadoColor = (e) => {
  if (e === 'entregado') return 'bg-green-500/20 text-green-400';
  if (e === 'cancelado') return 'bg-red-500/20 text-red-400';
  if (e === 'en proceso') return 'bg-blue-500/20 text-blue-400';
  return 'bg-yellow-500/20 text-yellow-400';
};

// ─── Modal nueva venta ─────────────────────────────────────────────────────
const ModalVenta = ({ productos, vendedor, onGuardar, onCerrar }) => {
  const [form, setForm] = useState({ cliente: '', telefono: '', notas: '', items: [] });
  const [buscar, setBuscar] = useState('');
  const [guardando, setGuardando] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const productosFiltrados = productos.filter(p =>
    !buscar || p.name?.toLowerCase().includes(buscar.toLowerCase())
  ).slice(0, 8);

  const agregar = (p) => {
    setForm(f => {
      const existe = f.items.find(i => i.id === p.id);
      if (existe) return { ...f, items: f.items.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) };
      return { ...f, items: [...f.items, { id: p.id, nombre: p.name, precio: p.price, qty: 1 }] };
    });
    setBuscar('');
  };

  const quitarItem = (id) => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));
  const cambiarQty = (id, qty) => setForm(f => ({ ...f, items: f.items.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i) }));
  const total = form.items.reduce((s, i) => s + i.precio * i.qty, 0);

  const guardar = async () => {
    if (!form.cliente) return;
    setGuardando(true);
    await registrarVenta({ ...form, total, vendedor: vendedor || 'Admin' });
    setGuardando(false);
    onGuardar();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-[#111827] rounded-2xl border border-white/10 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-bold text-white text-lg">Nueva Venta</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Cliente *</label>
              <input value={form.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Nombre del cliente"
                className="w-full bg-[#1f2937] border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FF2B5E]" />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Teléfono</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="9XXXXXXXX"
                className="w-full bg-[#1f2937] border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FF2B5E]" />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1">Agregar productos</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar producto..."
                className="w-full bg-[#1f2937] border border-white/10 text-white rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:border-[#FF2B5E]" />
            </div>
            {buscar && (
              <div className="mt-1 bg-[#1f2937] border border-white/10 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {productosFiltrados.map(p => (
                  <button key={p.id} onClick={() => agregar(p)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 text-sm text-left">
                    <span className="text-white truncate">{p.name}</span>
                    <span className="text-gray-400 ml-2 shrink-0">S/ {p.price}</span>
                  </button>
                ))}
                {productosFiltrados.length === 0 && <p className="text-gray-500 text-sm text-center py-3">Sin resultados</p>}
              </div>
            )}
          </div>

          {form.items.length > 0 && (
            <div className="bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden">
              {form.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-white text-sm flex-1 truncate">{item.nombre}</span>
                  <input type="number" min={1} value={item.qty} onChange={e => cambiarQty(item.id, parseInt(e.target.value))}
                    className="w-14 bg-[#1f2937] border border-white/10 text-white rounded-lg px-2 py-1 text-sm text-center outline-none" />
                  <span className="text-gray-400 text-sm w-20 text-right">S/ {(item.precio * item.qty).toFixed(2)}</span>
                  <button onClick={() => quitarItem(item.id)} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                </div>
              ))}
              <div className="px-3 py-2 flex justify-between text-sm font-bold">
                <span className="text-gray-400">Total</span>
                <span className="text-white">S/ {total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-gray-400 text-xs block mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} placeholder="Indicaciones, dirección de entrega..."
              className="w-full bg-[#1f2937] border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FF2B5E] resize-none" />
          </div>

          <button onClick={guardar} disabled={!form.cliente || form.items.length === 0 || guardando}
            className="w-full bg-[#FF2B5E] hover:bg-[#e0194a] text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50">
            {guardando ? 'Registrando...' : `Registrar venta · S/ ${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Vista ticket ──────────────────────────────────────────────────────────
const Ticket = ({ venta, onCerrar }) => {
  const ticketRef = useRef();
  const imprimir = () => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Ticket</title><style>
      body{font-family:monospace;font-size:12px;width:300px;margin:auto;padding:10px}
      h2{text-align:center;margin:0 0 4px}p{margin:2px 0}hr{border:1px dashed #000}
      .right{text-align:right}.bold{font-weight:bold}
    </style></head><body>
      <h2>MOMENTOS365</h2><p style="text-align:center">momentos365.com</p>
      <hr/><p>Cliente: <b>${venta.cliente}</b></p>
      ${venta.telefono ? `<p>Tel: ${venta.telefono}</p>` : ''}
      <p>Fecha: ${venta.fecha?.toDate?.()?.toLocaleDateString('es-PE') || new Date().toLocaleDateString()}</p>
      <hr/>
      ${(venta.items||[]).map(i => `<p>${i.nombre}<span class="right"> x${i.qty}  S/${(i.precio*i.qty).toFixed(2)}</span></p>`).join('')}
      <hr/><p class="bold right">TOTAL: S/ ${(venta.total||0).toFixed(2)}</p>
      ${venta.notas ? `<hr/><p>${venta.notas}</p>` : ''}
    </body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl w-full max-w-xs p-6 font-mono text-black text-sm" onClick={e => e.stopPropagation()} ref={ticketRef}>
        <div className="text-center mb-3">
          <p className="font-bold text-lg">MOMENTOS365</p>
          <p className="text-xs text-gray-500">momentos365.com</p>
        </div>
        <hr className="border-dashed border-gray-400 my-2" />
        <p>Cliente: <strong>{venta.cliente}</strong></p>
        {venta.telefono && <p>Tel: {venta.telefono}</p>}
        <p>Fecha: {venta.fecha?.toDate?.()?.toLocaleDateString('es-PE') || '—'}</p>
        <hr className="border-dashed border-gray-400 my-2" />
        {(venta.items || []).map(i => (
          <div key={i.id} className="flex justify-between gap-2">
            <span className="truncate">{i.nombre} x{i.qty}</span>
            <span className="shrink-0">S/{(i.precio*i.qty).toFixed(2)}</span>
          </div>
        ))}
        <hr className="border-dashed border-gray-400 my-2" />
        <div className="flex justify-between font-bold text-base">
          <span>TOTAL</span><span>S/ {(venta.total||0).toFixed(2)}</span>
        </div>
        {venta.notas && <><hr className="border-dashed border-gray-400 my-2" /><p className="text-xs">{venta.notas}</p></>}
        <div className="flex gap-2 mt-4">
          <button onClick={imprimir} className="flex-1 bg-black text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1"><Printer size={13} /> Imprimir</button>
          <button onClick={onCerrar} className="flex-1 bg-gray-100 text-xs font-bold py-2 rounded-lg">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ─── Principal ─────────────────────────────────────────────────────────────
const AdminVentas = ({ usuario }) => {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [modal, setModal] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [buscar, setBuscar] = useState('');

  useEffect(() => {
    const u1 = subscribeVentas(setVentas);
    const u2 = subscribeProductosRegalos(docs => setProductos(docs.map ? docs : []));
    return () => { u1(); u2(); };
  }, []);

  const filtered = ventas.filter(v =>
    !buscar || v.cliente?.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ShoppingBag size={22} /> Ventas</h1>
          <p className="text-gray-500 text-sm mt-1">{ventas.length} registros</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-[#FF2B5E] hover:bg-[#e0194a] text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
          <Plus size={16} /> Nueva venta
        </button>
      </div>

      <div className="mb-4">
        <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar cliente..."
          className="bg-[#111827] border border-white/10 text-white rounded-xl px-4 py-2 text-sm outline-none focus:border-[#FF2B5E] w-full max-w-xs" />
      </div>

      <div className="bg-[#111827] rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-white/10">
            <th className="px-5 py-3 text-left">Cliente</th>
            <th className="px-5 py-3 text-left hidden md:table-cell">Fecha</th>
            <th className="px-5 py-3 text-left hidden sm:table-cell">Items</th>
            <th className="px-5 py-3 text-left">Total</th>
            <th className="px-5 py-3 text-left">Estado</th>
            <th className="px-5 py-3" />
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-500 py-12">No hay ventas</td></tr>
            ) : filtered.map(v => (
              <tr key={v.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-3 text-white font-medium">{v.cliente || '—'}</td>
                <td className="px-5 py-3 text-gray-400 hidden md:table-cell text-xs">
                  {v.fecha?.toDate?.()?.toLocaleDateString('es-PE') || '—'}
                </td>
                <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">{(v.items||[]).length}</td>
                <td className="px-5 py-3 text-white font-bold">S/ {(v.total||0).toFixed(2)}</td>
                <td className="px-5 py-3">
                  <select value={v.estado || 'pendiente'} onChange={e => actualizarVenta(v.id, { estado: e.target.value })}
                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 outline-none cursor-pointer ${estadoColor(v.estado)}`}
                    style={{ background: 'transparent' }}>
                    {ESTADOS.map(e => <option key={e} value={e} className="bg-[#1f2937] text-white">{e}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => setTicket(v)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10" title="Ver ticket">
                    <Printer size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <ModalVenta productos={productos} vendedor={usuario?.nombre} onGuardar={() => setModal(false)} onCerrar={() => setModal(false)} />}
      {ticket && <Ticket venta={ticket} onCerrar={() => setTicket(null)} />}
    </div>
  );
};

export default AdminVentas;
