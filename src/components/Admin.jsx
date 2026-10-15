import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, Warehouse, ShoppingBag,
  Users, Camera, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import { loginUsuario } from '../adminFirebase';
import AdminDashboard from './admin/AdminDashboard';
import AdminProductos from './admin/AdminProductos';
import AdminInventario from './admin/AdminInventario';
import AdminVentas from './admin/AdminVentas';
import AdminUsuarios from './admin/AdminUsuarios';
import AdminRecuerdos from './AdminRecuerdos';

// ─── Sesión ────────────────────────────────────────────────────────────────
const SESION_KEY = 'm365_admin_v2';
const leerSesion = () => { try { const s = sessionStorage.getItem(SESION_KEY); return s ? JSON.parse(s) : null; } catch { return null; } };
const guardarSesion = (u) => { try { sessionStorage.setItem(SESION_KEY, JSON.stringify(u)); } catch {} };
const borrarSesion = () => { try { sessionStorage.removeItem(SESION_KEY); } catch {} };

// Clave maestra (dueño) — sin Firebase
const CLAVE_OWNER = import.meta.env.VITE_ADMIN_PASSWORD || '1502';
const OWNER = { id: '__owner__', nombre: 'Admin', rol: 'owner' };

// ─── Pantalla de login ─────────────────────────────────────────────────────
const Login = ({ onEntrar }) => {
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const entrar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    // Primero prueba clave maestra
    if (clave === CLAVE_OWNER) { guardarSesion(OWNER); onEntrar(OWNER); setCargando(false); return; }
    // Luego busca en Firebase
    const u = await loginUsuario(nombre, clave);
    setCargando(false);
    if (u) { guardarSesion(u); onEntrar(u); }
    else { setError('Usuario o clave incorrectos'); setClave(''); }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src="/images/logo.png" alt="logo" className="w-12 h-12 object-contain bg-white rounded-xl p-1" />
            <span className="text-white font-bold text-xl">Momentos365</span>
          </div>
          <p className="text-gray-400 text-sm">Panel de administración</p>
        </div>
        <form onSubmit={entrar} className="bg-[#111827] rounded-2xl p-6 border border-white/10 shadow-2xl space-y-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wider">Usuario</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre"
              className="w-full bg-[#1f2937] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF2B5E] transition" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wider">Clave</label>
            <input type="password" value={clave} onChange={e => setClave(e.target.value)} placeholder="••••••"
              className="w-full bg-[#1f2937] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF2B5E] transition" required />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={cargando}
            className="w-full bg-[#FF2B5E] hover:bg-[#e0194a] text-white font-bold py-2.5 rounded-xl transition disabled:opacity-60">
            {cargando ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Sidebar nav ───────────────────────────────────────────────────────────
const NAV = [
  { key: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard, roles: ['owner','admin','ventas','inventario'] },
  { key: 'productos',  label: 'Productos',   icon: Package,         roles: ['owner','admin'] },
  { key: 'inventario', label: 'Inventario',  icon: Warehouse,       roles: ['owner','admin','inventario'] },
  { key: 'ventas',     label: 'Ventas',      icon: ShoppingBag,     roles: ['owner','admin','ventas','inventario'] },
  { key: 'usuarios',   label: 'Usuarios',    icon: Users,           roles: ['owner','admin'] },
  { key: 'recuerdos',  label: 'Momentos QR', icon: Camera,          roles: ['owner','admin'] },
];

// ─── Admin principal ───────────────────────────────────────────────────────
const Admin = () => {
  const [usuario, setUsuario] = useState(leerSesion);
  const [seccion, setSeccion] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const salir = () => { borrarSesion(); setUsuario(null); };
  const nav = usuario ? NAV.filter(n => n.roles.includes(usuario.rol)) : [];
  const irA = (k) => { setSeccion(k); setMenuOpen(false); };

  if (!usuario) return <Login onEntrar={u => { setUsuario(u); setSeccion('dashboard'); }} />;

  const SECCIONES = {
    dashboard:  <AdminDashboard usuario={usuario} />,
    productos:  <AdminProductos />,
    inventario: <AdminInventario />,
    ventas:     <AdminVentas usuario={usuario} />,
    usuarios:   <AdminUsuarios sesion={usuario} />,
    recuerdos:  <AdminRecuerdos />,
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex text-white">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0a0e1a] border-r border-white/10 shrink-0 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <img src="/images/logo.png" alt="logo" className="w-9 h-9 object-contain bg-white rounded-lg p-0.5" />
          <div>
            <p className="text-sm font-bold text-white leading-tight">Momentos365</p>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => irA(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                seccion === key ? 'bg-[#FF2B5E] text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <Icon size={17} />
              {label}
              {seccion === key && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-5 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 px-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-[#FF2B5E] flex items-center justify-center text-xs font-bold">
              {usuario.nombre?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{usuario.nombre}</p>
              <p className="text-[10px] text-gray-500 capitalize">{usuario.rol}</p>
            </div>
          </div>
          <button onClick={salir} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 text-sm transition">
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-[#0a0e1a] border-b border-white/10 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <img src="/images/logo.png" alt="logo" className="w-7 h-7 object-contain bg-white rounded-md p-0.5" />
          <span className="font-bold text-sm">Momentos365 Admin</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-400 hover:text-white">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMenuOpen(false)}>
          <div className="w-60 h-full bg-[#0a0e1a] border-r border-white/10 pt-14" onClick={e => e.stopPropagation()}>
            <nav className="px-3 py-4 space-y-1">
              {nav.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => irA(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    seccion === key ? 'bg-[#FF2B5E] text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                  <Icon size={17} /> {label}
                </button>
              ))}
            </nav>
            <div className="px-3 border-t border-white/10 pt-4">
              <button onClick={salir} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 text-sm transition">
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      <main className="flex-1 min-w-0 md:overflow-auto">
        <div className="md:hidden h-14" />
        {SECCIONES[seccion] || SECCIONES.dashboard}
      </main>

    </div>
  );
};

export default Admin;
