import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, Warehouse } from 'lucide-react';
import { subscribeInventario, crearInsumo, actualizarInsumo, eliminarInsumo } from '../../adminFirebase';

const UNIDADES = ['und', 'hoja', 'rollo', 'metro', 'kg', 'gr', 'litro', 'ml', 'caja', 'bolsa', 'par'];

const InsumoRow = ({ item, onSave, onDelete }) => {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(item);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = () => { onSave(item.id, { nombre: form.nombre, unidad: form.unidad, costoUnitario: Number(form.costoUnitario), stock: Number(form.stock) }); setEditando(false); };

  if (!editando) return (
    <tr className="border-b border-white/5 hover:bg-white/5 group">
      <td className="px-5 py-3 text-white font-medium">{item.nombre}</td>
      <td className="px-5 py-3 text-gray-400">{item.unidad}</td>
      <td className="px-5 py-3 text-white">S/ {Number(item.costoUnitario || 0).toFixed(2)}</td>
      <td className="px-5 py-3 text-white">{item.stock || 0}</td>
      <td className="px-5 py-3">
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => { setForm(item); setEditando(true); }} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"><Pencil size={14} /></button>
          <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-400 p-1 rounded-lg hover:bg-red-400/10"><Trash2 size={14} /></button>
        </div>
      </td>
    </tr>
  );

  return (
    <tr className="border-b border-white/5 bg-white/5">
      <td className="px-3 py-2"><input value={form.nombre} onChange={e => set('nombre', e.target.value)} className="bg-[#1f2937] border border-white/20 rounded-lg px-2 py-1 text-white text-sm w-full outline-none focus:border-[#FF2B5E]" placeholder="Nombre" /></td>
      <td className="px-3 py-2"><select value={form.unidad} onChange={e => set('unidad', e.target.value)} className="bg-[#1f2937] border border-white/20 rounded-lg px-2 py-1 text-white text-sm outline-none focus:border-[#FF2B5E]">{UNIDADES.map(u => <option key={u}>{u}</option>)}</select></td>
      <td className="px-3 py-2"><input type="number" value={form.costoUnitario} onChange={e => set('costoUnitario', e.target.value)} className="bg-[#1f2937] border border-white/20 rounded-lg px-2 py-1 text-white text-sm w-24 outline-none focus:border-[#FF2B5E]" /></td>
      <td className="px-3 py-2"><input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} className="bg-[#1f2937] border border-white/20 rounded-lg px-2 py-1 text-white text-sm w-20 outline-none focus:border-[#FF2B5E]" /></td>
      <td className="px-3 py-2"><div className="flex gap-2"><button onClick={guardar} className="text-green-400 hover:bg-green-400/10 p-1 rounded-lg"><Check size={14} /></button><button onClick={() => setEditando(false)} className="text-gray-400 hover:bg-white/10 p-1 rounded-lg"><X size={14} /></button></div></td>
    </tr>
  );
};

const AdminInventario = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => subscribeInventario(setItems), []);

  const nuevo = async () => { await crearInsumo({ nombre: 'Nuevo insumo', unidad: 'und', costoUnitario: 0, stock: 0 }); };
  const filtered = items.filter(i => i.nombre?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Warehouse size={22} /> Inventario</h1>
          <p className="text-gray-500 text-sm mt-1">Insumos y materiales</p>
        </div>
        <button onClick={nuevo} className="flex items-center gap-2 bg-[#FF2B5E] hover:bg-[#e0194a] text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
          <Plus size={16} /> Nuevo insumo
        </button>
      </div>

      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar insumo..." className="bg-[#111827] border border-white/10 text-white rounded-xl px-4 py-2 text-sm outline-none focus:border-[#FF2B5E] w-full max-w-xs" />
      </div>

      <div className="bg-[#111827] rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-white/10">
            <th className="px-5 py-3 text-left">Insumo</th>
            <th className="px-5 py-3 text-left">Unidad</th>
            <th className="px-5 py-3 text-left">Costo unit.</th>
            <th className="px-5 py-3 text-left">Stock</th>
            <th className="px-5 py-3" />
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-gray-500 py-12">No hay insumos. Agrega el primero.</td></tr>
            ) : filtered.map(item => (
              <InsumoRow key={item.id} item={item}
                onSave={(id, d) => actualizarInsumo(id, d)}
                onDelete={(id) => eliminarInsumo(id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInventario;
