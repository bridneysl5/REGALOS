import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Save, Calculator, ChevronDown, ChevronUp, Search, Upload, Image } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebaseStorage';
import { subscribeInventario } from '../../adminFirebase';
import {
  subscribeProductosAdmin,
  crearProductoRegalo,
  actualizarProductoRegalo,
  eliminarProductoRegalo,
} from '../../productosFirebase';

const OCASIONES = [
  'Cumpleaños','Graduación','Aniversarios y Parejas','Para Ella','Para Él',
  'Nacimientos','Flores Amarillas','Hotwheels','Corporativos','Graduaciones',
];
const CATEGORIAS = [
  'Sets y Gift Boxes','Arreglos de Flores','Cuadros',
  'Tortas y Repostería','Hotweels','Otros',
];

/* ── Subir imagen → WebP ─────────────────────────────────────────────────── */
async function subirImagenWebp(file, nombre) {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob(async (blob) => {
          if (!blob) return reject(new Error('No se pudo convertir'));
          const slug = nombre.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
          const storageRef = ref(storage, `productos/${slug}_${Date.now()}.webp`);
          await uploadBytes(storageRef, blob, { contentType: 'image/webp' });
          const downloadUrl = await getDownloadURL(storageRef);
          URL.revokeObjectURL(url);
          resolve(downloadUrl);
        }, 'image/webp', 0.88);
      } catch (e) { reject(e); }
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* ── Calculadora de costos ───────────────────────────────────────────────── */
function Calculadora({ insumos, onGuardar, inicial }) {
  const [items, setItems] = useState(inicial || []);

  const [precioVenta, setPrecioVenta] = useState(inicial?.precioVenta || 0);
  const [busqueda, setBusqueda] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filtrados = insumos.filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const agregarInsumo = (ins) => {
    if (items.find(it => it.id === ins.id)) return;
    setItems(prev => [...prev, { id: ins.id, nombre: ins.nombre, unidad: ins.unidad, costoUnitario: ins.costoUnitario, cantidad: 1 }]);
    setBusqueda(''); setShowSearch(false);
  };
  const quitarInsumo = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const setCantidad = (id, val) => setItems(prev => prev.map(i => i.id === id ? { ...i, cantidad: parseFloat(val) || 0 } : i));

  const costoInsumos = items.reduce((s, i) => s + (i.costoUnitario * i.cantidad), 0);
  const gananciaAntes = parseFloat(precioVenta || 0) - costoInsumos;
  const manoObra = Math.max(0, gananciaAntes) * 0.70;
  const costoTotal = costoInsumos + manoObra;
  const ganancia = parseFloat(precioVenta || 0) - costoTotal;
  const margen = precioVenta > 0 ? ((ganancia / parseFloat(precioVenta)) * 100).toFixed(1) : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-4">
      <h3 className="text-white font-semibold flex items-center gap-2"><Calculator size={16}/> Calculadora de costos</h3>
      <div className="relative">
        <button onClick={() => setShowSearch(!showSearch)} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
          <Plus size={14}/> Agregar insumo
        </button>
        {showSearch && (
          <div className="absolute z-20 top-7 left-0 w-72 bg-gray-700 rounded-lg shadow-xl border border-gray-600">
            <div className="p-2">
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                <Search size={14} className="text-gray-400"/>
                <input autoFocus value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar insumo..." className="bg-transparent text-sm text-white outline-none w-full"/>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtrados.length === 0 && <p className="text-gray-400 text-sm px-4 py-2">Sin resultados</p>}
              {filtrados.map(i => (
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
      {items.length > 0 && (
        <table className="w-full text-sm">
          <thead><tr className="text-gray-400 text-xs">
            <th className="text-left pb-1">Insumo</th><th className="text-center pb-1">Cant.</th>
            <th className="text-right pb-1">Subtotal</th><th></th>
          </tr></thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} className="border-t border-gray-700">
                <td className="py-1 text-white">{it.nombre} <span className="text-gray-400 text-xs">({it.unidad})</span></td>
                <td className="py-1 text-center">
                  <input type="number" min="0" step="0.1" value={it.cantidad} onChange={e => setCantidad(it.id, e.target.value)}
                    className="w-16 text-center bg-gray-700 rounded px-1 text-white text-sm"/>
                </td>
                <td className="py-1 text-right text-green-400">S/{(it.costoUnitario * it.cantidad).toFixed(2)}</td>
                <td className="py-1 pl-2"><button onClick={() => quitarInsumo(it.id)} className="text-gray-500 hover:text-red-400"><X size={12}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex items-center gap-3">
        <label className="text-gray-400 text-sm w-32">Precio de venta (S/)</label>
        <input type="number" min="0" step="0.5" value={precioVenta} onChange={e => setPrecioVenta(e.target.value)}
          className="w-24 bg-gray-700 rounded px-2 py-1 text-white text-sm text-right"/>
      </div>
      <div className="bg-gray-900 rounded-lg p-3 space-y-1 text-sm">
        <div className="flex justify-between text-gray-300"><span>Costo insumos</span><span>S/{costoInsumos.toFixed(2)}</span></div>
        <div className="flex justify-between text-gray-300"><span>Mano de obra <span className="text-xs text-blue-400">(70%)</span></span><span>S/{manoObra.toFixed(2)}</span></div>
        <div className="flex justify-between text-white font-semibold border-t border-gray-700 pt-1 mt-1"><span>Costo total</span><span>S/{costoTotal.toFixed(2)}</span></div>
        <div className={`flex justify-between font-semibold ${ganancia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          <span>Ganancia</span><span>S/{ganancia.toFixed(2)} ({margen}%)</span>
        </div>
      </div>
      <button onClick={() => onGuardar({ items, manoObra, precioVenta: parseFloat(precioVenta||0), costoTotal, ganancia })}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
        <Save size={14}/> Guardar en producto
      </button>
    </div>
  );
}

/* ── Modal crear/editar ──────────────────────────────────────────────────── */
function ModalProducto({ producto, insumos, onClose, onGuardar }) {
  const [form, setForm] = useState(producto ? { ...producto } : {
    nombre: '', descripcion: '', precio: '', moneda: 'S/',
    categoria: '', imagen: '', ocasiones: [], paquete: false, destacado: false,
  });
  const [showCalc, setShowCalc] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(producto?.imagen || '');
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleOcasion = (oc) => {
    const arr = form.ocasiones || [];
    set('ocasiones', arr.includes(oc) ? arr.filter(o => o !== oc) : [...arr, oc]);
  };

  const handleArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    if (!form.nombre.trim()) { setError('Escribe el nombre antes de subir la imagen'); return; }
    setSubiendo(true);
    setError('');
    try {
      const url = await subirImagenWebp(file, form.nombre);
      set('imagen', url);
      setPreview(url);
    } catch (err) {
      setError('Error al subir imagen: ' + err.message);
    } finally {
      setSubiendo(false);
    }
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
    if (subiendo) { setError('Espera a que termine de subir la imagen'); return; }
    setGuardando(true);
    try {
      await onGuardar(form);
      onClose();
    } catch (e) { setError('Error al guardar: ' + e.message); }
    finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">{producto ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X/></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

          {/* Nombre */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm" placeholder="Nombre del producto"/>
          </div>

          {/* Imagen */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Imagen del producto</label>
            <div className="flex gap-3 items-start">
              {/* Preview */}
              <div className="w-24 h-24 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                onClick={() => fileRef.current?.click()}>
                {preview ? (
                  <img src={preview} alt="" className="w-full h-full object-cover"/>
                ) : (
                  <div className="text-center">
                    <Image size={24} className="text-gray-600 mx-auto"/>
                    <p className="text-gray-600 text-xs mt-1">Sin imagen</p>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <button onClick={() => fileRef.current?.click()} disabled={subiendo}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-3 py-2 text-sm w-full justify-center">
                  {subiendo ? (
                    <><span className="animate-spin">⏳</span> Convirtiendo a WebP...</>
                  ) : (
                    <><Upload size={14}/> Subir imagen (se convierte a WebP)</>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleArchivo}/>
                <p className="text-gray-500 text-xs">O pega una URL directamente:</p>
                <input value={form.imagen} onChange={e => { set('imagen', e.target.value); setPreview(e.target.value); }}
                  className="w-full bg-gray-800 rounded-lg px-3 py-1.5 text-white text-xs" placeholder="https://..."/>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm resize-none" placeholder="Descripción del producto"/>
          </div>

          {/* Precio + Moneda */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-gray-400 text-sm block mb-1">Precio</label>
              <input type="number" min="0" step="0.5" value={form.precio} onChange={e => set('precio', e.target.value)}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm" placeholder="0.00"/>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Moneda</label>
              <select value={form.moneda || 'S/'} onChange={e => set('moneda', e.target.value)}
                className="bg-gray-800 rounded-lg px-3 py-2 text-white text-sm">
                <option>S/</option><option>$</option>
              </select>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-gray-400 text-sm block mb-2">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map(c => {
                const sel = form.categoria === c;
                return (
                  <button key={c} onClick={() => set('categoria', sel ? '' : c)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      sel ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400 hover:border-blue-500'
                    }`}>{c}</button>
                );
              })}
            </div>
          </div>

          {/* Ocasiones */}
          <div>
            <label className="text-gray-400 text-sm block mb-2">Ocasiones</label>
            <div className="flex flex-wrap gap-2">
              {OCASIONES.map(oc => {
                const sel = (form.ocasiones || []).includes(oc);
                return (
                  <button key={oc} onClick={() => toggleOcasion(oc)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      sel ? 'bg-pink-600 border-pink-600 text-white' : 'border-gray-600 text-gray-400 hover:border-pink-500'
                    }`}>{oc}</button>
                );
              })}
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.paquete} onChange={e => set('paquete', e.target.checked)} className="w-4 h-4 accent-pink-500"/>
              <span className="text-gray-300 text-sm">Es paquete</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.destacado} onChange={e => set('destacado', e.target.checked)} className="w-4 h-4 accent-yellow-500"/>
              <span className="text-gray-300 text-sm">Destacado (Top)</span>
            </label>
          </div>

          {/* Calculadora */}
          <div>
            <button onClick={() => setShowCalc(!showCalc)}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium">
              <Calculator size={14}/>
              {showCalc ? 'Ocultar' : 'Abrir'} calculadora de costos
              {showCalc ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>
            {form.costo && (
              <p className="text-xs text-gray-400 mt-1">
                Costo total: S/{form.costo.costoTotal?.toFixed(2)} · Ganancia: S/{form.costo.ganancia?.toFixed(2)}
              </p>
            )}
            {showCalc && (
              <div className="mt-3">
                <Calculadora insumos={insumos} onGuardar={guardarCalc} inicial={form.costo?.items || []}/>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-700">
          <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm">Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando || subiendo}
            className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
            <Save size={14}/> {guardando ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Principal ───────────────────────────────────────────────────────────── */
export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const u1 = subscribeProductosAdmin(setProductos);
    const u2 = subscribeInventario(setInsumos);
    return () => { u1(); u2(); };
  }, []);

  const filtrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleGuardar = async (form) => {
    if (form.id) await actualizarProductoRegalo(form.id, form);
    else await crearProductoRegalo(form);
  };

  const handleEliminar = async (id) => { await eliminarProductoRegalo(id); setConfirmDelete(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-xl">Productos <span className="text-gray-500 text-sm font-normal">({filtrados.length})</span></h2>
        <button onClick={() => setModal('nuevo')}
          className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
          <Plus size={16}/> Nuevo producto
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o categoría..."
          className="w-full bg-gray-800 rounded-lg pl-9 pr-3 py-2 text-white text-sm"/>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-700">
            <tr>
              <th className="text-left text-gray-300 px-4 py-3 font-medium">Producto</th>
              <th className="text-left text-gray-300 px-4 py-3 font-medium">Precio</th>
              <th className="text-left text-gray-300 px-4 py-3 font-medium">Costo</th>
              <th className="text-left text-gray-300 px-4 py-3 font-medium">Ganancia</th>
              <th className="text-left text-gray-300 px-4 py-3 font-medium hidden md:table-cell">Categoría</th>
              <th className="text-right text-gray-300 px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-500 py-8">No hay productos</td></tr>
            )}
            {filtrados.map(p => {
              const precio = parseFloat(p.precio) || 0;
              const costo = p.costo?.costoTotal || 0;
              const ganancia = costo > 0 ? precio - costo : null;
              const margen = ganancia !== null && precio > 0 ? ((ganancia / precio) * 100).toFixed(0) : null;
              return (
                <tr key={p.id} className="border-t border-gray-700 hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imagen ? (
                        <img src={p.imagen} alt="" className="w-10 h-10 rounded-lg object-cover"/>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-gray-500 text-xs">IMG</div>
                      )}
                      <div>
                        <p className="text-white font-medium leading-tight">{p.nombre}</p>
                        <p className="text-gray-400 text-xs">{(p.ocasiones || []).slice(0,2).join(', ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold">{p.moneda || 'S/'}{precio}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{costo > 0 ? `S/${costo.toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3">
                    {ganancia !== null ? (
                      <span className={`font-semibold text-sm ${ganancia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        S/{ganancia.toFixed(2)}
                        {margen && <span className="text-xs ml-1 opacity-70">({margen}%)</span>}
                      </span>
                    ) : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-300 hidden md:table-cell text-sm">{p.categoria || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setModal(p)} className="text-blue-400 hover:text-blue-300 mr-3"><Edit2 size={15}/></button>
                    <button onClick={() => setConfirmDelete(p)} className="text-red-400 hover:text-red-300"><Trash2 size={15}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <ModalProducto producto={modal === 'nuevo' ? null : modal} insumos={insumos}
          onClose={() => setModal(null)} onGuardar={handleGuardar}/>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="text-white font-semibold mb-2">¿Eliminar producto?</p>
            <p className="text-gray-400 text-sm mb-5">"{confirmDelete.nombre}" se eliminará permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm">Cancelar</button>
              <button onClick={() => handleEliminar(confirmDelete.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
