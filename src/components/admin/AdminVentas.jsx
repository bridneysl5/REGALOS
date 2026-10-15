import { useState, useEffect } from 'react';
import {
  Search, X, ShoppingBag, Send, Phone, User, FileText, Heart,
  Package, Plus, Minus, MapPin, Truck, ChevronDown, ChevronUp,
  CheckCircle2, Trash2,
} from 'lucide-react';
import { subscribeProductosAdmin } from '../../productosFirebase';
import { registrarVenta } from '../../adminFirebase';

const OCASIONES = [
  'Todos','Cumpleaños','Graduación','Aniversarios y Parejas','Para Ella','Para Él',
  'Nacimientos','Flores Amarillas','Hotwheels','Corporativos','Graduaciones',
];

function generarIdPedido() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'M365-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

/* ── Panel lateral del pedido ─────────────────────────────────────────────── */
function PanelPedido({ items, onQuitar, onCantidad, vendedor, onLimpiar }) {
  const [form, setForm] = useState({
    cliente: '', telefono: '', direccion: '',
    delivery: false, precioDelivery: '',
    de: '', para: '', dedicatoria: '', notas: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [seccion, setSeccion] = useState('cliente'); // cliente | dedicatoria | notas
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const costoDelivery = form.delivery ? parseFloat(form.precioDelivery || 0) : 0;
  const total = subtotal + costoDelivery;

  const crearPedido = async () => {
    if (items.length === 0) return;
    setGuardando(true);
    try {
      const idPedido = generarIdPedido();
      const datos = {
        idPedido,
        items: items.map(i => ({ id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, imagen: i.imagen || '' })),
        total,
        subtotal,
        adelanto: 0,
        cliente: form.cliente,
        telefono: form.telefono,
        direccion: form.direccion,
        delivery: { incluye: form.delivery, precio: costoDelivery },
        notas: form.notas,
        dedicatoria: { de: form.de, para: form.para, mensaje: form.dedicatoria },
        estado: 'pendiente',
        entregado: false,
        vendedor: vendedor?.nombre || 'Admin',
      };
      const docRef = await registrarVenta(datos);
      setPedidoCreado({ ...datos, firestoreId: docRef.id });
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const enviarWhatsApp = () => {
    const p = pedidoCreado;
    const tel = (p.telefono || '').replace(/\D/g, '');
    let msg = `🎁 *PEDIDO ${p.idPedido}*\n\n`;
    p.items.forEach(i => { msg += `• ${i.cantidad}x ${i.nombre} — S/${(i.precio * i.cantidad).toFixed(2)}\n`; });
    if (p.delivery?.incluye) msg += `🚚 Delivery: S/${p.delivery.precio.toFixed(2)}\n`;
    msg += `\n💰 *Total: S/${p.total.toFixed(2)}*`;
    if (p.cliente) msg += `\n\n👤 ${p.cliente}`;
    if (p.telefono) msg += `\n📞 ${p.telefono}`;
    if (p.direccion) msg += `\n📍 ${p.direccion}`;
    if (p.dedicatoria?.de || p.dedicatoria?.para || p.dedicatoria?.mensaje) {
      msg += `\n\n💌 *Dedicatoria*`;
      if (p.dedicatoria.de) msg += `\nDe: ${p.dedicatoria.de}`;
      if (p.dedicatoria.para) msg += `\nPara: ${p.dedicatoria.para}`;
      if (p.dedicatoria.mensaje) msg += `\n"${p.dedicatoria.mensaje}"`;
    }
    if (p.notas) msg += `\n\n📝 ${p.notas}`;
    msg += `\n\n¡Gracias por tu compra en *Momentos365*! 🛍️`;
    const url = tel ? `https://wa.me/51${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const resetear = () => {
    setPedidoCreado(null);
    setForm({ cliente: '', telefono: '', direccion: '', delivery: false, precioDelivery: '', de: '', para: '', dedicatoria: '', notas: '' });
    onLimpiar();
  };

  if (pedidoCreado) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center">
          <CheckCircle2 size={40} className="text-green-400 mx-auto mb-2"/>
          <p className="text-white font-bold text-lg">¡Pedido creado!</p>
          <p className="text-yellow-400 font-mono font-bold text-lg mt-1">{pedidoCreado.idPedido}</p>
          <p className="text-green-400 font-bold text-xl mt-2">S/{pedidoCreado.total.toFixed(2)}</p>
        </div>
        <button onClick={enviarWhatsApp}
          className="w-full bg-[#25D366] hover:bg-[#1fb855] text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
          <Send size={18}/> Enviar ticket WhatsApp
        </button>
        <button onClick={resetear}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-2.5 font-medium text-sm">
          Nuevo pedido
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Items del pedido */}
      <div className="bg-gray-800 rounded-xl p-3 min-h-[80px]">
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Toca un producto para agregarlo →</p>
        ) : (
          <div className="space-y-2">
            {items.map(it => (
              <div key={it.id} className="flex items-center gap-2">
                {it.imagen ? <img src={it.imagen} className="w-8 h-8 rounded-lg object-cover flex-shrink-0"/> : <div className="w-8 h-8 bg-gray-700 rounded-lg flex-shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{it.nombre}</p>
                  <p className="text-green-400 text-xs">S/{(it.precio * it.cantidad).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onCantidad(it.id, it.cantidad - 1)} className="w-6 h-6 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"><Minus size={10}/></button>
                  <span className="text-white text-xs w-5 text-center">{it.cantidad}</span>
                  <button onClick={() => onCantidad(it.id, it.cantidad + 1)} className="w-6 h-6 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"><Plus size={10}/></button>
                  <button onClick={() => onQuitar(it.id)} className="w-6 h-6 rounded-md text-gray-500 hover:text-red-400 flex items-center justify-center ml-1"><X size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total */}
      {items.length > 0 && (
        <div className="bg-gray-900 rounded-xl px-4 py-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>S/{subtotal.toFixed(2)}</span></div>
          {form.delivery && <div className="flex justify-between text-gray-400"><span>Delivery</span><span>S/{costoDelivery.toFixed(2)}</span></div>}
          <div className="flex justify-between text-white font-bold border-t border-gray-700 pt-1.5"><span>Total</span><span className="text-green-400 text-base">S/{total.toFixed(2)}</span></div>
        </div>
      )}

      {/* Tabs de secciones */}
      <div className="flex rounded-xl bg-gray-800 p-1 gap-1 text-xs">
        {[['cliente','👤 Cliente'],['dedicatoria','💌 Dedicat.'],['notas','📝 Notas']].map(([k,l]) => (
          <button key={k} onClick={() => setSeccion(k)}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${seccion === k ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Sección Cliente */}
      {seccion === 'cliente' && (
        <div className="space-y-2.5">
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={form.cliente} onChange={e => set('cliente', e.target.value)}
              placeholder="Nombre cliente"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
          </div>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={form.telefono} onChange={e => set('telefono', e.target.value)}
              placeholder="Teléfono" type="tel"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
          </div>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)}
              placeholder="Dirección"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
          </div>
          {/* Delivery toggle */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2 text-gray-300 text-sm"><Truck size={14}/> Incluye delivery</span>
              <div onClick={() => set('delivery', !form.delivery)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${form.delivery ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.delivery ? 'translate-x-5' : 'translate-x-0.5'}`}/>
              </div>
            </label>
            {form.delivery && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                <input type="number" min="0" step="1" value={form.precioDelivery}
                  onChange={e => set('precioDelivery', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-8 pr-3 py-2 text-white text-sm outline-none focus:border-blue-500"/>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección Dedicatoria */}
      {seccion === 'dedicatoria' && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.de} onChange={e => set('de', e.target.value)}
              placeholder="De:"
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-pink-500"/>
            <input value={form.para} onChange={e => set('para', e.target.value)}
              placeholder="Para:"
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-pink-500"/>
          </div>
          <textarea value={form.dedicatoria} onChange={e => set('dedicatoria', e.target.value)}
            placeholder="Mensaje de la dedicatoria..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-pink-500 resize-none"/>
        </div>
      )}

      {/* Sección Notas */}
      {seccion === 'notas' && (
        <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
          placeholder="Ej: Entregar el sábado en la mañana, incluir moño azul..."
          rows={5}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 resize-none"/>
      )}

      {/* Crear pedido */}
      <button onClick={crearPedido} disabled={guardando || items.length === 0}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 mt-1">
        {guardando ? 'Creando...' : <><ShoppingBag size={18}/> Crear Pedido{items.length > 0 ? ` (${items.length})` : ''}</>}
      </button>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────────────────────── */
export default function AdminVentas({ usuario }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ocasionFiltro, setOcasionFiltro] = useState('Todos');
  const [itemsPedido, setItemsPedido] = useState([]);

  useEffect(() => subscribeProductosAdmin(setProductos), []);

  const agregarProducto = (p) => {
    setItemsPedido(prev => {
      const existe = prev.find(i => i.id === p.id);
      if (existe) return prev.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { id: p.id, nombre: p.nombre, precio: p.precio, imagen: p.imagen, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id, cantidad) => {
    if (cantidad <= 0) setItemsPedido(prev => prev.filter(i => i.id !== id));
    else setItemsPedido(prev => prev.map(i => i.id === id ? { ...i, cantidad } : i));
  };

  const quitarItem = (id) => setItemsPedido(prev => prev.filter(i => i.id !== id));

  const filtrados = productos.filter(p => {
    const matchBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchOcasion = ocasionFiltro === 'Todos' || (p.ocasiones || []).includes(ocasionFiltro);
    return matchBusqueda && matchOcasion;
  });

  const totalItems = itemsPedido.reduce((s, i) => s + i.cantidad, 0);

  return (
    <div className="flex gap-5 items-start">
      {/* ── Productos (izquierda) ── */}
      <div className="flex-1 min-w-0 space-y-4">
        <div>
          <h2 className="text-white text-2xl font-bold">Nueva Venta</h2>
          <p className="text-gray-400 text-sm">{productos.length} productos · Toca para agregar al pedido</p>
        </div>
        {/* Búsqueda */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
        </div>
        {/* Filtro ocasiones */}
        <div className="flex gap-2 flex-wrap">
          {OCASIONES.map(oc => (
            <button key={oc} onClick={() => setOcasionFiltro(oc)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                ocasionFiltro === oc ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}>
              {oc}
            </button>
          ))}
        </div>
        {/* Grid de productos */}
        {filtrados.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Package size={48} className="mx-auto mb-3 opacity-30"/>
            <p>No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtrados.map(p => {
              const enPedido = itemsPedido.find(i => i.id === p.id);
              return (
                <button key={p.id} onClick={() => agregarProducto(p)}
                  className={`border rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] group relative ${
                    enPedido ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-blue-500/60'
                  }`}>
                  <div className="aspect-square bg-gray-900 relative overflow-hidden">
                    {p.imagen
                      ? <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>
                      : <div className="w-full h-full flex items-center justify-center"><Package size={28} className="text-gray-600"/></div>
                    }
                    {enPedido && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{enPedido.cantidad}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-white text-xs font-medium leading-tight line-clamp-2">{p.nombre}</p>
                    <p className="text-green-400 font-bold text-sm mt-1">S/{Number(p.precio).toFixed(2)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Panel pedido (derecha) ── */}
      <div className="w-64 lg:w-72 flex-shrink-0 sticky top-4">
        <div className="bg-gray-850 border border-gray-700 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold flex items-center gap-2">
              <ShoppingBag size={18} className="text-blue-400"/>
              Pedido
              {totalItems > 0 && <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">{totalItems}</span>}
            </h3>
            {itemsPedido.length > 0 && (
              <button onClick={() => setItemsPedido([])} className="text-gray-500 hover:text-red-400 text-xs flex items-center gap-1">
                <Trash2 size={12}/> Limpiar
              </button>
            )}
          </div>
          <PanelPedido
            items={itemsPedido}
            onQuitar={quitarItem}
            onCantidad={cambiarCantidad}
            vendedor={usuario}
            onLimpiar={() => setItemsPedido([])}
          />
        </div>
      </div>
    </div>
  );
}
