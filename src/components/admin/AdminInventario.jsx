import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, Warehouse, PackagePlus, Calculator } from 'lucide-react';
import { subscribeInventario, crearInsumo, actualizarInsumo, eliminarInsumo } from '../../adminFirebase';

const UNIDADES = ['und', 'hoja', 'rollo', 'metro', 'kg', 'gr', 'litro', 'ml', 'caja', 'bolsa', 'par'];

/* ── Modal crear insumo ───────────────────────────────────────────────────── */
function ModalCrear({ onCerrar, onGuardado }) {
  const [form, setForm] = useState({ nombre: '', unidad: 'und', cantidad: '', costoTotal: '' });
  const [guardando, setGuardando] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const costoUnit = form.cantidad > 0 && form.costoTotal > 0
    ? (parseFloat(form.costoTotal) / parseFloat(form.cantidad)).toFixed(4)
    : null;

  const guardar = async () => {
    if (!form.nombre.trim() || !form.cantidad || !form.costoTotal) return;
    setGuardando(true);
    try {
      await crearInsumo({
        nombre: form.nombre.trim(),
        unidad: form.unidad,
        stock: parseFloat(form.cantidad),
        costoUnitario: parseFloat(costoUnit),
        ultimaCompra: { cantidad: parseFloat(form.cantidad), costoTotal: parseFloat(form.costoTotal) },
      });
      onGuardado();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-white/10">
        <div className="px-6 pt-5 pb-4 border-b border-white/10 flex items-center justify-between">
          <p className="text-white font-bold text-lg flex items-center gap-2"><PackagePlus size={18} className="text-[#FF2B5E]"/> Nuevo Insumo</p>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white p-1"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Nombre del insumo *</label>
            <input autoFocus value={form.nombre} onChange={e => set('nombre', e.target.value)}
              placeholder="Ej: Cinta de regalo, Globos, Cartulina..."
              className="w-full bg-[#111827] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF2B5E]"/>
          </div>

          {/* Unidad */}
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Unidad de medida</label>
            <select value={form.unidad} onChange={e => set('unidad', e.target.value)}
              className="w-full bg-[#111827] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF2B5E]">
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Cantidad comprada + costo total */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">Cantidad comprada *</label>
              <input type="number" min="0" step="any" value={form.cantidad} onChange={e => set('cantidad', e.target.value)}
                placeholder={`0 ${form.unidad}`}
                className="w-full bg-[#111827] border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#FF2B5E]"/>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">Costo total (S/) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                <input type="number" min="0" step="0.01" value={form.costoTotal} onChange={e => set('costoTotal', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#111827] border border-white/15 rounded-xl pl-8 pr-3 py-2.5 text-white text-sm outline-none focus:border-[#FF2B5E]"/>
              </div>
            </div>
          </div>

          {/* Costo unitario calculado */}
          {costoUnit && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <Calculator size={16} className="text-blue-400"/>
              <span className="text-gray-300 text-sm">Costo unitario:</span>
              <span className="text-blue-400 font-bold text-sm">S/{costoUnit} / {form.unidad}</span>
            </div>
          )}
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onCerrar} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-2.5 text-sm">Cancelar</button>
          <button onClick={guardar} disabled={guardando || !form.nombre.trim() || !form.cantidad || !form.costoTotal}
            className="flex-1 bg-[#FF2B5E] hover:bg-[#e0194a] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
            <Check size={14}/> {guardando ? 'Guardando...' : 'Crear insumo'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal agregar stock ──────────────────────────────────────────────────── */
function ModalAgregarStock({ item, onCerrar, onGuardado }) {
  const [cantidad, setCantidad] = useState('');
  const [costoTotal, setCostoTotal] = useState('');
  const [guardando, setGuardando] = useState(false);

  const stockActual = Number(item.stock || 0);
  const costoActual = Number(item.costoUnitario || 0);
  const nuevaCant = parseFloat(cantidad) || 0;
  const nuevoCostoTotal = parseFloat(costoTotal) || 0;
  const nuevoCostUnit = nuevaCant > 0 ? nuevoCostoTotal / nuevaCant : 0;

  // Promedio ponderado
  const stockFinal = stockActual + nuevaCant;
  const costoPromedio = stockFinal > 0
    ? (stockActual * costoActual + nuevoCostoTotal) / stockFinal
    : nuevoCostUnit;

  const guardar = async () => {
    if (!cantidad || !costoTotal) return;
    setGuardando(true);
    try {
      await actualizarInsumo(item.id, {
        stock: stockFinal,
        costoUnitario: parseFloat(costoPromedio.toFixed(4)),
        ultimaCompra: { cantidad: nuevaCant, costoTotal: nuevoCostoTotal },
      });
      onGuardado();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl border border-white/10">
        <div className="px-6 pt-5 pb-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-white font-bold">Agregar Stock</p>
            <p className="text-gray-400 text-sm">{item.nombre}</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white p-1"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Info actual */}
          <div className="bg-gray-800 rounded-xl p-3 grid grid-cols-2 gap-2 text-sm">
            <div><p className="text-gray-500 text-xs">Stock actual</p><p className="text-white font-medium">{stockActual} {item.unidad}</p></div>
            <div><p className="text-gray-500 text-xs">Costo unit. actual</p><p className="text-white font-medium">S/{costoActual.toFixed(4)}</p></div>
          </div>

          {/* Nueva compra */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">Cantidad comprada *</label>
              <input autoFocus type="number" min="0" step="any" value={cantidad} onChange={e => setCantidad(e.target.value)}
                placeholder={`0 ${item.unidad}`}
                className="w-full bg-[#111827] border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#FF2B5E]"/>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">Costo total (S/) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                <input type="number" min="0" step="0.01" value={costoTotal} onChange={e => setCostoTotal(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#111827] border border-white/15 rounded-xl pl-8 pr-3 py-2.5 text-white text-sm outline-none focus:border-[#FF2B5E]"/>
              </div>
            </div>
          </div>

          {/* Resultado calculado */}
          {nuevaCant > 0 && nuevoCostoTotal > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Costo unit. esta compra</span><span className="text-white">S/{nuevoCostUnit.toFixed(4)}/{item.unidad}</span></div>
              <div className="flex justify-between border-t border-green-500/20 pt-1.5">
                <span className="text-gray-300 font-medium">Stock final</span>
                <span className="text-green-400 font-bold">{stockFinal} {item.unidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 font-medium">Costo unit. promedio</span>
                <span className="text-green-400 font-bold">S/{costoPromedio.toFixed(4)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onCerrar} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-2.5 text-sm">Cancelar</button>
          <button onClick={guardar} disabled={guardando || !cantidad || !costoTotal}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
            <Plus size={14}/> {guardando ? 'Guardando...' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Fila editable ────────────────────────────────────────────────────────── */
const InsumoRow = ({ item, onSave, onDelete, onAgregarStock }) => {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(item);
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = () => {
    onSave(item.id, {
      nombre: form.nombre,
      unidad: form.unidad,
      costoUnitario: Number(form.costoUnitario),
      stock: Number(form.stock),
    });
    setEditando(false);
  };

  const valorStock = (Number(item.stock || 0) * Number(item.costoUnitario || 0));

  if (!editando) return (
    <tr className="border-b border-white/5 hover:bg-white/5 group">
      <td className="px-5 py-3 text-white font-medium">{item.nombre}</td>
      <td className="px-5 py-3 text-gray-400">{item.unidad}</td>
      <td className="px-5 py-3">
        <span className={`font-semibold ${Number(item.stock) <= 0 ? 'text-red-400' : Number(item.stock) <= 5 ? 'text-yellow-400' : 'text-white'}`}>
          {item.stock || 0}
        </span>
        {Number(item.stock) <= 0 && <span className="ml-2 text-xs text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full">Sin stock</span>}
        {Number(item.stock) > 0 && Number(item.stock) <= 5 && <span className="ml-2 text-xs text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full">Bajo</span>}
      </td>
      <td className="px-5 py-3 text-white">S/ {Number(item.costoUnitario || 0).toFixed(4)}</td>
      <td className="px-5 py-3 text-gray-400 text-sm">S/ {valorStock.toFixed(2)}</td>
      <td className="px-5 py-3">
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition items-center">
          <button onClick={() => onAgregarStock(item)}
            title="Agregar stock"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg transition">
            <Plus size={12}/> Stock
          </button>
          <button onClick={() => { setForm(item); setEditando(true); setConfirmDel(false); }}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10"><Pencil size={13}/></button>
          {!confirmDel
            ? <button onClick={() => setConfirmDel(true)} className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10"><Trash2 size={13}/></button>
            : <div className="flex gap-1">
                <button onClick={() => onDelete(item.id)} className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg"><Trash2 size={13}/></button>
                <button onClick={() => setConfirmDel(false)} className="p-1.5 bg-gray-600 text-white rounded-lg text-xs">✕</button>
              </div>
          }
        </div>
      </td>
    </tr>
  );

  return (
    <tr className="border-b border-white/5 bg-white/5">
      <td className="px-3 py-2"><input value={form.nombre} onChange={e => set('nombre', e.target.value)}
        className="bg-[#1f2937] border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm w-full outline-none focus:border-[#FF2B5E]"/></td>
      <td className="px-3 py-2"><select value={form.unidad} onChange={e => set('unidad', e.target.value)}
        className="bg-[#1f2937] border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm outline-none focus:border-[#FF2B5E]">
        {UNIDADES.map(u => <option key={u}>{u}</option>)}</select></td>
      <td className="px-3 py-2"><input type="number" value={form.stock} onChange={e => set('stock', e.target.value)}
        className="bg-[#1f2937] border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm w-20 outline-none focus:border-[#FF2B5E]"/></td>
      <td className="px-3 py-2"><input type="number" step="0.0001" value={form.costoUnitario} onChange={e => set('costoUnitario', e.target.value)}
        className="bg-[#1f2937] border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm w-28 outline-none focus:border-[#FF2B5E]"/></td>
      <td className="px-3 py-2 text-gray-500 text-sm">—</td>
      <td className="px-3 py-2"><div className="flex gap-2">
        <button onClick={guardar} className="text-green-400 hover:bg-green-400/10 p-1.5 rounded-lg"><Check size={14}/></button>
        <button onClick={() => setEditando(false)} className="text-gray-400 hover:bg-white/10 p-1.5 rounded-lg"><X size={14}/></button>
      </div></td>
    </tr>
  );
};

/* ── Componente principal ─────────────────────────────────────────────────── */
const AdminInventario = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [showCrear, setShowCrear] = useState(false);
  const [itemStock, setItemStock] = useState(null);

  useEffect(() => subscribeInventario(setItems), []);

  const filtered = items.filter(i => i.nombre?.toLowerCase().includes(search.toLowerCase()));
  const valorTotal = filtered.reduce((s, i) => s + (Number(i.stock || 0) * Number(i.costoUnitario || 0)), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Warehouse size={22}/> Inventario</h1>
          <p className="text-gray-500 text-sm mt-1">Insumos y materiales</p>
        </div>
        <button onClick={() => setShowCrear(true)}
          className="flex items-center gap-2 bg-[#FF2B5E] hover:bg-[#e0194a] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
          <Plus size={16}/> Nuevo insumo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#111827] border border-white/10 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-white">{items.length}</p><p className="text-gray-500 text-xs">Tipos de insumo</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-400">{items.filter(i => Number(i.stock || 0) <= 0).length}</p><p className="text-gray-500 text-xs">Sin stock</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-blue-400">S/{valorTotal.toFixed(2)}</p><p className="text-gray-500 text-xs">Valor total</p>
        </div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Buscar insumo..."
        className="bg-[#111827] border border-white/10 text-white rounded-xl px-4 py-2 text-sm outline-none focus:border-[#FF2B5E] w-full max-w-xs"/>

      <div className="bg-[#111827] rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-white/10 uppercase tracking-wider">
              <th className="px-5 py-3 text-left">Insumo</th>
              <th className="px-5 py-3 text-left">Unidad</th>
              <th className="px-5 py-3 text-left">Stock</th>
              <th className="px-5 py-3 text-left">Costo unit.</th>
              <th className="px-5 py-3 text-left">Valor stock</th>
              <th className="px-5 py-3"/>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-500 py-12">No hay insumos. Agrega el primero.</td></tr>
            ) : filtered.map(item => (
              <InsumoRow key={item.id} item={item}
                onSave={(id, d) => actualizarInsumo(id, d)}
                onDelete={(id) => eliminarInsumo(id)}
                onAgregarStock={setItemStock}
              />
            ))}
          </tbody>
        </table>
      </div>

      {showCrear && <ModalCrear onCerrar={() => setShowCrear(false)} onGuardado={() => setShowCrear(false)}/>}
      {itemStock && <ModalAgregarStock item={itemStock} onCerrar={() => setItemStock(null)} onGuardado={() => setItemStock(null)}/>}
    </div>
  );
};

export default AdminInventario;
