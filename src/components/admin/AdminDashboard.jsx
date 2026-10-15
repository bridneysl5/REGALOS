import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, Warehouse, TrendingUp } from 'lucide-react';
import { subscribeVentas } from '../../adminFirebase';
import { subscribeProductosRegalos } from '../../productosFirebase';
import { subscribeInventario } from '../../adminFirebase';

const Tile = ({ icon: Icon, label, valor, color }) => (
  <div className="bg-[#111827] rounded-2xl p-5 border border-white/10 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-gray-400 text-xs font-medium">{label}</p>
      <p className="text-white text-2xl font-bold">{valor}</p>
    </div>
  </div>
);

const AdminDashboard = ({ usuario }) => {
  const [ventas, setVentas] = useState([]);
  const [numProductos, setNumProductos] = useState(0);
  const [numInsumos, setNumInsumos] = useState(0);

  useEffect(() => {
    const u1 = subscribeVentas(setVentas);
    const u2 = subscribeProductosRegalos(setNumProductos);
    const u3 = subscribeInventario(items => setNumInsumos(items.length));
    return () => { u1(); u2(); u3(); };
  }, []);

  const hoy = new Date().toDateString();
  const ventasHoy = ventas.filter(v => v.fecha?.toDate?.()?.toDateString() === hoy);
  const totalHoy = ventasHoy.reduce((s, v) => s + (v.total || 0), 0);
  const pendientes = ventas.filter(v => v.estado === 'pendiente').length;
  const productos = Array.isArray(numProductos) ? numProductos.length : numProductos;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Bienvenido, {usuario?.nombre} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen del día</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Tile icon={TrendingUp} label="Ventas hoy" valor={`S/ ${totalHoy.toFixed(0)}`} color="bg-[#FF2B5E]/20 text-[#FF2B5E]" />
        <Tile icon={ShoppingBag} label="Pedidos pendientes" valor={pendientes} color="bg-yellow-500/20 text-yellow-400" />
        <Tile icon={Package} label="Productos" valor={productos} color="bg-blue-500/20 text-blue-400" />
        <Tile icon={Warehouse} label="Insumos" valor={numInsumos} color="bg-green-500/20 text-green-400" />
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
              <th className="px-5 py-3 text-left">Total</th>
              <th className="px-5 py-3 text-left">Estado</th>
            </tr></thead>
            <tbody>
              {ventas.slice(0, 8).map(v => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-5 py-3 text-white font-medium">{v.cliente || '—'}</td>
                  <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">
                    {v.fecha?.toDate?.()?.toLocaleDateString('es-PE') || '—'}
                  </td>
                  <td className="px-5 py-3 text-white">S/ {(v.total || 0).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      v.estado === 'entregado' ? 'bg-green-500/20 text-green-400' :
                      v.estado === 'cancelado' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'}`}>
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
