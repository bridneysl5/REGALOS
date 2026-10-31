import { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, TrendingUp, Receipt, MessageCircle, Award, Globe, Tag } from 'lucide-react';
import { subscribeVentas, subscribePedidosWeb } from '../../adminFirebase';
import { subscribeProductosAdmin } from '../../productosFirebase';
import { etiquetaOrigen, useAhora } from './origenes';

const DIA = 24 * 60 * 60 * 1000;
const fechaDe = (v) => {
  const ts = v.fecha || v.creadoEn;
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
};
const soles = (n) => `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const esValida = (v) => v.estado !== 'cancelada' && v.estado !== 'cancelado';

const ESTADO_ESTILO = {
  pendiente: 'bg-yellow-500/20 text-yellow-400',
  haciendo:  'bg-blue-500/20 text-blue-400',
  terminada: 'bg-green-500/20 text-green-400',
  cancelada: 'bg-red-500/20 text-red-400',
};

const Tile = ({ icon: Icon, label, valor, sub, color }) => (
  <div className="bg-[#111827] rounded-2xl p-5 border border-white/10 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={22} />
    </div>
    <div className="min-w-0">
      <p className="text-gray-400 text-xs font-medium">{label}</p>
      <p className="text-white text-2xl font-bold truncate">{valor}</p>
      {sub && <p className="text-gray-500 text-xs truncate">{sub}</p>}
    </div>
  </div>
);

const Barras = ({ titulo, icon: Icon, filas, formato = (n) => n }) => {
  const max = Math.max(1, ...filas.map(f => f.valor));
  return (
    <div className="bg-[#111827] rounded-2xl p-5 border border-white/10">
      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Icon size={15} /> {titulo}</h2>
      {filas.length === 0 ? (
        <p className="text-gray-500 text-sm">Sin datos en este periodo</p>
      ) : (
        <div className="space-y-2.5">
          {filas.map(f => (
            <div key={f.etiqueta} className="flex items-center gap-3 text-sm">
              <span className="w-32 text-gray-300 truncate" title={f.etiqueta}>{f.etiqueta}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className="h-2 bg-[#FF2B5E] rounded-full" style={{ width: `${(f.valor / max) * 100}%` }} />
              </div>
              <span className="w-20 text-right text-white font-medium">{formato(f.valor)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = ({ usuario }) => {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pedidosWeb, setPedidosWeb] = useState([]);
  const [periodo, setPeriodo] = useState(30);
  const ahora = useAhora();

  useEffect(() => {
    const u1 = subscribeVentas(setVentas, () => {});
    const u2 = subscribeProductosAdmin(setProductos);
    const u3 = subscribePedidosWeb(setPedidosWeb, () => {});
    return () => { u1(); u2(); u3(); };
  }, []);

  const datos = useMemo(() => {
    const hoy = new Date(ahora).toDateString();
    const validas = ventas.filter(esValida);
    const enPeriodo = validas.filter(v => { const d = fechaDe(v); return d && ahora - d.getTime() <= periodo * DIA; });

    const sumar = (lista) => lista.reduce((s, v) => s + (Number(v.total) || 0), 0);
    const totalPeriodo = sumar(enPeriodo);

    // Ventas por día (últimos 14 días)
    const dias = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(ahora - (13 - i) * DIA);
      return { clave: d.toDateString(), etiqueta: d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }), total: 0 };
    });
    const porDia = Object.fromEntries(dias.map(d => [d.clave, d]));
    validas.forEach(v => { const d = fechaDe(v); if (d && porDia[d.toDateString()]) porDia[d.toDateString()].total += Number(v.total) || 0; });

    // Productos más vendidos y por categoría
    const categoriaDe = Object.fromEntries(productos.map(p => [p.id, p.categoria || 'Sin categoría']));
    const porProducto = {};
    const porCategoria = {};
    enPeriodo.forEach(v => (v.items || []).forEach(it => {
      const cant = Number(it.cantidad) || 1;
      const nombre = it.nombre || 'Sin nombre';
      porProducto[nombre] = (porProducto[nombre] || 0) + cant;
      const cat = categoriaDe[it.id] || 'Sin categoría';
      porCategoria[cat] = (porCategoria[cat] || 0) + (Number(it.precio) || 0) * cant;
    }));

    // Por canal
    const porOrigen = {};
    enPeriodo.forEach(v => { const o = etiquetaOrigen(v.origen); porOrigen[o] = (porOrigen[o] || 0) + (Number(v.total) || 0); });

    const ordenar = (obj, n = 6) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([etiqueta, valor]) => ({ etiqueta, valor }));

    const webPeriodo = pedidosWeb.filter(p => { const d = p.creadoEn?.toDate?.(); return d && ahora - d.getTime() <= periodo * DIA; });

    return {
      hoy: sumar(validas.filter(v => fechaDe(v)?.toDateString() === hoy)),
      totalPeriodo,
      cantidadPeriodo: enPeriodo.length,
      ticket: enPeriodo.length ? totalPeriodo / enPeriodo.length : 0,
      pendientes: ventas.filter(v => (v.estado || 'pendiente') === 'pendiente').length,
      dias,
      top: ordenar(porProducto, 5),
      categorias: ordenar(porCategoria),
      origenes: ordenar(porOrigen),
      web: webPeriodo.length,
      webSinResponder: webPeriodo.filter(p => (p.estado || 'nuevo') === 'nuevo').length,
    };
  }, [ventas, productos, pedidosWeb, periodo, ahora]);

  const maxDia = Math.max(1, ...datos.dias.map(d => d.total));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Bienvenido, {usuario?.nombre} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen del negocio (no cuenta ventas canceladas)</p>
        </div>
        <select value={periodo} onChange={e => setPeriodo(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2">
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
          <option value={365}>Último año</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile icon={TrendingUp} label="Ventas hoy" valor={soles(datos.hoy)} color="bg-[#FF2B5E]/20 text-[#FF2B5E]" />
        <Tile icon={Receipt} label={`Ventas ${periodo} días`} valor={soles(datos.totalPeriodo)}
          sub={`${datos.cantidadPeriodo} pedidos · ticket prom. ${soles(datos.ticket)}`} color="bg-green-500/20 text-green-400" />
        <Tile icon={ShoppingBag} label="Pedidos pendientes" valor={datos.pendientes} color="bg-yellow-500/20 text-yellow-400" />
        <Tile icon={MessageCircle} label={`Escribieron desde la web (${periodo} d)`} valor={datos.web}
          sub={`${datos.webSinResponder} sin responder`} color="bg-blue-500/20 text-blue-400" />
      </div>

      {/* Ventas por día */}
      <div className="bg-[#111827] rounded-2xl p-5 border border-white/10">
        <h2 className="text-sm font-bold text-white mb-4">Ventas de los últimos 14 días</h2>
        <div className="flex items-end gap-1.5 h-36">
          {datos.dias.map(d => (
            <div key={d.clave} className="flex-1 flex flex-col items-center justify-end h-full group" title={`${d.etiqueta}: ${soles(d.total)}`}>
              <div className="w-full bg-[#FF2B5E]/80 group-hover:bg-[#FF2B5E] rounded-t-md transition-all"
                style={{ height: `${Math.max(d.total ? 4 : 0, (d.total / maxDia) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-2">
          {datos.dias.map((d, i) => (
            <span key={d.clave} className="flex-1 text-center text-[10px] text-gray-500">{i % 2 === 0 ? d.etiqueta : ''}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Barras titulo="Productos más vendidos (unidades)" icon={Award} filas={datos.top} />
        <Barras titulo="Ventas por canal" icon={Globe} filas={datos.origenes} formato={soles} />
        <Barras titulo="Ventas por categoría" icon={Tag} filas={datos.categorias} formato={soles} />
      </div>

      {/* Últimas ventas */}
      <div className="bg-[#111827] rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white">Últimas ventas</h2>
        </div>
        {ventas.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-10">No hay ventas registradas aún</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-white/10">
              <th className="px-5 py-3 text-left">Cliente</th>
              <th className="px-5 py-3 text-left hidden sm:table-cell">Fecha</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Canal</th>
              <th className="px-5 py-3 text-left">Total</th>
              <th className="px-5 py-3 text-left">Estado</th>
            </tr></thead>
            <tbody>
              {ventas.slice(0, 8).map(v => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-5 py-3 text-white font-medium">{v.cliente || '—'}</td>
                  <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">{fechaDe(v)?.toLocaleDateString('es-PE') || '—'}</td>
                  <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{v.origen ? etiquetaOrigen(v.origen) : '—'}</td>
                  <td className="px-5 py-3 text-white">S/ {(Number(v.total) || 0).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_ESTILO[v.estado] || ESTADO_ESTILO.pendiente}`}>
                      {v.estado || 'pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
