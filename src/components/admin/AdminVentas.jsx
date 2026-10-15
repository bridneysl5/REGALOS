import { useState, useEffect } from 'react';
import { Search, X, ShoppingBag, Send, Phone, User, FileText, Heart, Package } from 'lucide-react';
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

/* ── Modal detalle pedido ─────────────────────────────────────────────────── */
function ModalPedido({ producto, vendedor, onCerrar }) {
  const [form, setForm] = useState({ cliente: '', telefono: '', notas: '', de: '', para: '', dedicatoria: '' });
  const [guardando, setGuardando] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const crearPedido = async () => {
    setGuardando(true);
    try {
      const idPedido = generarIdPedido();
      const datos = {
        idPedido,
        producto: { id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen },
        total: producto.precio,
        cliente: form.cliente,
        telefono: form.telefono,
        notas: form.notas,
        dedicatoria: { de: form.de, para: form.para, mensaje: form.dedicatoria },
        estado: 'pendiente',
        entregado: false,
        vendedor: vendedor?.nombre || 'Admin',
      };
      const docRef = await registrarVenta(datos);
      setPedidoCreado({ ...datos, firestoreId: docRef.id });
    } catch (e) {
      alert('Error al crear pedido: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const enviarWhatsApp = () => {
    if (!form.telefono && !pedidoCreado) return;
    const tel = (form.telefono || pedidoCreado?.telefono || '').replace(/\D/g, '');
    const p = pedidoCreado;
    let msg = `🎁 *PEDIDO ${p.idPedido}*\n\n`;
    msg += `📦 *${p.producto.nombre}*\n`;
    msg += `💰 Precio: S/${Number(p.total).toFixed(2)}\n`;
    if (p.cliente) msg += `\n👤 Cliente: ${p.cliente}`;
    if (p.telefono) msg += `\n📞 Tel: ${p.telefono}`;
    if (p.dedicatoria?.de || p.dedicatoria?.para || p.dedicatoria?.mensaje) {
      msg += `\n\n💌 *Dedicatoria:*`;
      if (p.dedicatoria.de) msg += `\nDe: ${p.dedicatoria.de}`;
      if (p.dedicatoria.para) msg += `\nPara: ${p.dedicatoria.para}`;
      if (p.dedicatoria.mensaje) msg += `\n"${p.dedicatoria.mensaje}"`;
    }
    if (p.notas) msg += `\n\n📝 Notas: ${p.notas}`;
    msg += `\n\n¡Gracias por tu compra en *Momentos365*! 🛍️`;
    const url = tel
      ? `https://wa.me/51${tel}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const precio = Number(producto.precio).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gray-900 px-6 pt-6 pb-4 border-b border-gray-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {producto.imagen
              ? <img src={producto.imagen} alt={producto.nombre} className="w-14 h-14 rounded-xl object-cover"/>
              : <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center"><Package size={24} className="text-gray-500"/></div>
            }
            <div>
              <p className="text-white font-semibold text-lg leading-tight">{producto.nombre}</p>
              <p className="text-green-400 font-bold text-xl">S/{precio}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white p-1"><X size={20}/></button>
        </div>

        {!pedidoCreado ? (
          <div className="p-6 space-y-4">
            <p className="text-gray-400 text-sm">Todos los campos son opcionales 👌</p>

            {/* Cliente */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-gray-300 text-sm font-medium"><User size={14}/> Nombre del cliente</label>
              <input value={form.cliente} onChange={e => set('cliente', e.target.value)}
                placeholder="Ej: María García"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
            </div>

            {/* Teléfono */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-gray-300 text-sm font-medium"><Phone size={14}/> Teléfono</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)}
                placeholder="Ej: 999888777" type="tel"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
            </div>

            {/* Dedicatoria */}
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4 space-y-3">
              <p className="flex items-center gap-2 text-pink-300 text-sm font-medium"><Heart size={14}/> Dedicatoria</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">De:</label>
                  <input value={form.de} onChange={e => set('de', e.target.value)}
                    placeholder="Nombre"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-pink-500"/>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Para:</label>
                  <input value={form.para} onChange={e => set('para', e.target.value)}
                    placeholder="Nombre"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-pink-500"/>
                </div>
              </div>
              <textarea value={form.dedicatoria} onChange={e => set('dedicatoria', e.target.value)}
                placeholder="Escribe el mensaje de la dedicatoria..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-pink-500 resize-none"/>
            </div>

            {/* Notas */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-gray-300 text-sm font-medium"><FileText size={14}/> Notas del pedido</label>
              <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
                placeholder="Ej: Entregar el sábado en la mañana"
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500 resize-none"/>
            </div>

            <button onClick={crearPedido} disabled={guardando}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
              {guardando ? 'Creando...' : <><ShoppingBag size={18}/> Crear Pedido</>}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag size={32} className="text-green-400"/>
            </div>
            <div>
              <p className="text-white font-bold text-xl">¡Pedido creado!</p>
              <p className="text-gray-400 text-sm mt-1">ID: <span className="text-yellow-400 font-mono font-bold">{pedidoCreado.idPedido}</span></p>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 text-left text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-400">Producto</span><span className="text-white font-medium">{pedidoCreado.producto.nombre}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total</span><span className="text-green-400 font-bold">S/{Number(pedidoCreado.total).toFixed(2)}</span></div>
              {pedidoCreado.cliente && <div className="flex justify-between"><span className="text-gray-400">Cliente</span><span className="text-white">{pedidoCreado.cliente}</span></div>}
              {pedidoCreado.telefono && <div className="flex justify-between"><span className="text-gray-400">Teléfono</span><span className="text-white">{pedidoCreado.telefono}</span></div>}
              {pedidoCreado.dedicatoria?.mensaje && (
                <div className="border-t border-gray-700 pt-2">
                  <p className="text-pink-300 text-xs font-medium mb-1">💌 Dedicatoria</p>
                  {pedidoCreado.dedicatoria.de && <p className="text-gray-300">De: {pedidoCreado.dedicatoria.de}</p>}
                  {pedidoCreado.dedicatoria.para && <p className="text-gray-300">Para: {pedidoCreado.dedicatoria.para}</p>}
                  <p className="text-white italic">"{pedidoCreado.dedicatoria.mensaje}"</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={enviarWhatsApp}
                className="flex-1 bg-[#25D366] hover:bg-[#1fb855] text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
                <Send size={18}/> Enviar por WhatsApp
              </button>
              <button onClick={onCerrar}
                className="px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium">
                Listo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────────────────────── */
export default function AdminVentas({ usuario }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ocasionFiltro, setOcasionFiltro] = useState('Todos');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  useEffect(() => subscribeProductosAdmin(setProductos), []);

  const filtrados = productos.filter(p => {
    const matchBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchOcasion = ocasionFiltro === 'Todos' || (p.ocasiones || []).includes(ocasionFiltro);
    return matchBusqueda && matchOcasion;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white text-2xl font-bold">Nueva Venta</h2>
          <p className="text-gray-400 text-sm">{productos.length} productos disponibles</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"
        />
      </div>

      {/* Filtro ocasiones */}
      <div className="flex gap-2 flex-wrap">
        {OCASIONES.map(oc => (
          <button key={oc} onClick={() => setOcasionFiltro(oc)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              ocasionFiltro === oc
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtrados.map(p => (
            <button key={p.id} onClick={() => setProductoSeleccionado(p)}
              className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500 rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] group">
              <div className="aspect-square bg-gray-900 relative overflow-hidden">
                {p.imagen
                  ? <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>
                  : <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-gray-600"/></div>
                }
                {p.destacado && (
                  <span className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">TOP</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-white text-sm font-medium leading-tight line-clamp-2">{p.nombre}</p>
                <p className="text-green-400 font-bold text-base mt-1">{p.moneda || 'S/'}{Number(p.precio).toFixed(2)}</p>
                {p.categoria && <p className="text-gray-500 text-xs mt-0.5 truncate">{p.categoria}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {productoSeleccionado && (
        <ModalPedido
          producto={productoSeleccionado}
          vendedor={usuario}
          onCerrar={() => setProductoSeleccionado(null)}
        />
      )}
    </div>
  );
}
