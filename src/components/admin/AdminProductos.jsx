import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Calculator, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { subscribeInventario } from '../../adminFirebase';
import {
  subscribeProductosRegalos,
  crearProductoRegalo,
  actualizarProductoRegalo,
  eliminarProductoRegalo,
} from '../../productosFirebase';

const OCASIONES = ['Cumpleaños','San Valentín','Aniversario','Día de la Madre','Día del Padre','Navidad','Graduaciones','Corporativos','Baby Shower','Boda'];
const CATEGORIAS = ['Desayunos','Bouquet','Cajas','Canastas','Paquetes Corporativos','Otros'];
const MONEDAS = ['S/','$'];

const empty = {
  nombre: '', descripcion: '', precio: '', moneda: 'S/',
  categoria: '', imagen: '', ocasiones: [],
  paquete: false, destacado: false,
};

/* ── Calculadora de costos ─────────────────────────────────── */
function Calculadora({ insumos, onGuardar, inicial }) {
  const [items, setItems] = useState(inicial || []);
  const [manoObra, setManoObra] = useState(0);
  const [precioVenta, setPrecioVenta] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const insumosFiltrados = insumos.filter(i =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregarInsumo = (ins) => {
    if (items.find(it => it.id === ins.id)) return;
    setItems(prev => [...prev, { id: ins.id, nombre: ins.nombre, unidad: ins.unidad, costoUnitario: ins.costoUnitario, cantidad: 1 }]);
    setBusqueda('');
    setShowSearch(false);
  };

  const quitarInsumo = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const setCantidad = (id, val) => setItems(prev => prev.map(i => i.id === id ? { ...i, cantidad: parseFloat(val) || 0 } : i));

  const costoInsumos = items.reduce((s, i) => s + (i.costoUnitario * i.cantidad), 0);
  const costoTotal = costoInsumos + parseFloat(manoObra || 0);
  const ganancia = parseFloat(precioVenta || 0) - costoTotal;
  const margen = precioVenta > 0 ? ((ganancia / parseFloat(precioVenta)) * 100).toFixed(1) : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-4">
      <h3 className="text-white font-semibold flex items-center gap-2">
        <Calculator size={16} /> Calculadora de costos
      </h3>

      {/* Agregar insumo */}
      <div className="relative">
        <button onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
          <Plus size={14} /> Agregar insumo
        </button>
        {showSearch && (
          <div className="absolute z-20 top-7 left-0 w-72 bg-gray-700 rounded-lg shadow-xl border border-gray-600">
            <div className="p-2">
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                <Search size={14} className="text-gray-400" />
                <input autoFocus value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar insumo..."
                  className="bg-transparent text-sm text-white outline-none w-full" />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {insumosFiltrados.length === 0 && (
                <p className="text-gray-400 text-sm px-4 py-2">Sin resultados</p>
              )}
              {insumosFiltrados.map(i => (
                <button key={i.id} onClick={() => agregarInsumo(i)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-600 text-sm text-white flex justify-between">
                  <span>{i.nombre}</span>
                  <span className="text-gray-400">{i.unidad} · S/{i.costoUnitario}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabla insumos */}
      {items.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs">
              <th className="text-left pb-1">Insumo</th>
              <th className="text-center pb-1">Cant.</th>
              <th className="text-right pb-1">Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} className="border-t border-gray-700">
                <td className="py-1 text-white">{it.nombre} <span className="text-gray-400 text-xs">({it.unidad})</span></td>
                <td className="py-1 text-center">
                  <input type="number" min="0" step="0.1" value={it.cantidad}
                    onChange={e => setCantidad(it.id, e.target.value)}
                    className="w-16 text-center bg-gray-700 rounded px-1 text-white text-sm" />
                </td>
                <td className="py-1 text-right text-green-400">S/{(it.costoUnitario * it.cantidad).toFixed(2)}</td>
                <td className="py-1 pl-2">
                  <button onClick={() => quitarInsumo(it.id)} className="text-gray-500 hover:text-red-400">
                    <X size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Mano de obra */}
      <div className="flex items-center gap-3">
        <label className="text-gray-400 text-sm w-32">Mano de obra (S/)</label>
        <input type="number" min="0" step="0.5" value={manoObra}
          onChange={e => setManoObra(e.target.value)}
          className="w-24 bg-gray-700 rounded px-2 py-1 text-white text-sm text-right" />
      </div>

      {/* Precio de venta */}
      <div className="flex items-center gap-3">
        <label className="text-gray-400 text-sm w-32">Precio de venta (S/)</label>
        <input type="number" min="0" step="0.5" value={precioVenta}
          onChange={e => setPrecioVenta(e.target.value)}
          className="w-24 bg-gray-700 rounded px-2 py-1 text-white text-sm text-right" />
      </div>

      {/* Resumen */}
      <div className="bg-gray-900 rounded-lg p-3 space-y-1 text-sm">
        <div className="flex justify-between text-gray-300">
          <span>Costo insumos</span><span>S/{costoInsumos.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Mano de obra</span><span>S/{parseFloat(manoObra||0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-white font-semibold border-t border-gray-700 pt-1 mt-1">
          <span>Costo total</span><span>S/{costoTotal.toFixed(2)}</span>
        </div>
        <div className={`flex justify-between font-semibold ${ganancia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          <span>Ganancia</span><span>S/{ganancia.toFixed(2)} ({margen}%)</span>
        </div>
      </div>

      <button onClick={() => onGuardar({ items, manoObra: parseFloat(manoObra||0), precioVenta: parseFloat(precioVenta||0), costoTotal, ganancia })}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
        <Save size={14} /> Guardar en producto
      </button>
    </div>
  );
}

/* ── Modal crear/editar ────────────────────────────────────── */
function ModalProducto({ producto, insumos, onClose, onGuardar }) {
  const [form, setForm] = useState(producto ? { ...producto } : { ...empty });
  const [showCalc, setShowCalc] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleOcasion = (oc) => {
    const arr = form.ocasiones || [];
    set('ocasiones', arr.includes(oc) ? arr.filter(o => o !== oc) : [...arr, oc]);
  };

  const guardarCalc = (datos) => {
    setForm(f => ({
      ...f,
      costo: datos,
      precio: datos.precioVenta > 0 ? String(datos.precioVenta) : f.precio,
    }));
    setShowCalc(false);
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setGuardando(true);
    try {
      await onGuardar(form);
      onClose();
    } catch (e) {
      setError('Error al guardar: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">{producto ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>

        <div className="p-5 space-y-4">
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Nombre */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm" placeholder="Nombre del producto" />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm resize-none" placeholder="Descripción del producto" />
          </div>

          {/* Precio + Moneda */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-gray-400 text-sm block mb-1">Precio</label>
              <input type="number" min="0" step="0.5" value={form.precio} onChange={e => set('precio', e.target.value)}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm" placeholder="0.00" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Moneda</label>
              <select value={form.moneda || 'S/'} onChange={e => set('moneda', e.target.value)}
                className="bg-gray-800 rounded-lg px-3 py-2 text-white text-sm">
                {MONEDAS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Categoría</label>
            <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm">
              <option value="">Sin categoría</option>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Ocasiones */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Ocasiones</label>
            <div className="flex flex-wrap gap-2">
              {OCASIONES.map(oc => {
                const sel = (form.ocasiones || []).includes(oc);
                return (
                  <button key={oc} onClick={() => toggleOcasion(oc)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      sel ? 'bg-pink-600 border-pink-600 text-white' : 'border-gray-600 text-gray-400 hover:border-pink-500'
                    }`}>
                    {oc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* URL imagen */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">URL imagen</label>
            <input value={form.imagen} onChange={e => set('imagen', e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm" placeholder="https://..." />
            {form.imagen && (
              <img src={form.imagen} alt="" className="mt-2 h-24 w-24 object-cover rounded-lg" />
            )}
          </div>

          {/* Flags */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.paquete} onChange={e => set('paquete', e.target.checked)}
                className="w-4 h-4 accent-pink-500" />
              <span className="text-gray-300 text-sm">Es paquete</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.destacado} onChange={e => set('destacado', e.target.checked)}
                className="w-4 h-4 accent-yellow-500" />
              <span className="text-gray-300 text-sm">Destacado</span>
            </label>
          </div>

          {/* Calculadora */}
          <div>
            <button onClick={() => setShowCalc(!showCalc)}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium">
              <Calculator size={14} />
              {showCalc ? 'Ocultar' : 'Abrir'} calculadora de costos
              {showCalc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {form.costo && (
              <p className="text-xs text-gray-400 mt-1">
                Costo total guardado: S/{form.costo.costoTotal?.toFixed(2)} · Ganancia: S/{form.costo.ganancia?.toFixed(2)}
              </p>
            )}
            {showCalc && (
              <div className="mt-3">
                <Calculadora insumos={insumos} onGuardar={guardarCalc} inicial={form.costo?.items || []} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-700">
          <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
            <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Principal ─────────────────────────────────────────────── */
export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null); // null | 'nuevo' | producto
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const u1 = subscribeProductosRegalos(setProductos);
    const u2 = subscribeInventario(setInsumos);
    return () => { u1(); u2(); };
  }, []);

  const filtrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleGuardar = async (form) => {
    if (form.id) {
      await actualizarProductoRegalo(form.id, form);
    } else {
      await crearProductoRegalo(form);
    }
  };

  const handleEliminar = async (id) => {
    await eliminarProductoRegalo(id);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-xl">Productos</h2>
        <button onClick={() => setModal('nuevo')}
          className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o categoría..."
          className="w-full bg-gray-800 rounded-lg pl-9 pr-3 py-2 text-white text-sm" />
      </div>

      {/* Tabla */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700">
            <tr>
              <th className="text-left text-gray-300 px-4 py-3 font-medium">Producto</th>
              <th className="text-left text-gray-300 px-4 py-3 font-medium hidden md:table-cell">Categoría</th>
              <th className="text-left text-gray-300 px-4 py-3 font-medium">Precio</th>
              <th className="text-left text-gray-300 px-4 py-3 font-medium hidden lg:table-cell">Costo</th>
              <th className="text-right text-gray-300 px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-500 py-8">No hay productos</td></tr>
            )}
            {filtrados.map(p => (
              <tr key={p.id} className="border-t border-gray-700 hover:bg-gray-750 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.imagen ? (
                      <img src={p.imagen} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-gray-500 text-xs">IMG</div>
                    )}
                    <div>
                      <p className="text-white font-medium">{p.nombre}</p>
                      <p className="text-gray-400 text-xs">{(p.ocasiones || []).slice(0,2).join(', ')}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300 hidden md:table-cell">{p.categoria || '—'}</td>
                <td className="px-4 py-3 text-white font-semibold">{p.moneda || 'S/'}{p.precio}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {p.costo ? (
                    <span className="text-gray-400 text-xs">S/{p.costo.costoTotal?.toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-600 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setModal(p)}
                    className="text-blue-400 hover:text-blue-300 mr-3"><Edit2 size={15} /></button>
                  <button onClick={() => setConfirmDelete(p)}
                    className="text-red-400 hover:text-red-300"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <ModalProducto
          producto={modal === 'nuevo' ? null : modal}
          insumos={insumos}
          onClose={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}

      {/* Confirmar eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="text-white font-semibold mb-2">¿Eliminar producto?</p>
            <p className="text-gray-400 text-sm mb-5">"{confirmDelete.nombre}" se eliminará permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm">Cancelar</button>
              <button onClick={() => handleEliminar(confirmDelete.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
