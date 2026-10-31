import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, Warehouse, ShoppingBag, History,
  Users, Camera, Sparkles, LogOut, Menu, X, ChevronRight, MessageCircle,
} from 'lucide-react';
import { escucharSesion, iniciarSesion, cerrarSesion, enviarCambioDeClave, mensajeAuth } from '../adminAuth';
import AdminDashboard from './admin/AdminDashboard';
import AdminProductos from './admin/AdminProductos';
import AdminInventario from './admin/AdminInventario';
import AdminVentas from './admin/AdminVentas';
import AdminHistorialVentas from './admin/AdminHistorialVentas';
import AdminUsuarios from './admin/AdminUsuarios';
import AdminRecuerdos from './AdminRecuerdos';
import AdminMomentosRA from './admin/AdminMomentosRA';
import AdminPedidosWeb from './admin/AdminPedidosWeb';

// ─── Pantalla de login ─────────────────────────────────────────────────────
// Cada persona entra con su correo y clave de Firebase Authentication.
// Ya no hay clave maestra ni claves guardadas en la base de datos.
const Marco = ({ children }) => (
  <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <img src="/images/logo.png" alt="logo" className="w-12 h-12 object-contain bg-white rounded-xl p-1" />
          <span className="text-white font-bold text-xl">Momentos365</span>
        </div>
        <p className="text-gray-400 text-sm">Panel de administración</p>
      </div>
      {children}
    </div>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const entrar = async (e) => {
    e.preventDefault();
    setError(''); setAviso('');
    setCargando(true);
    try {
      await iniciarSesion(email, clave);
      // escucharSesion (en Admin) se encarga de mostrar el panel.
    } catch (err) {
      setError(mensajeAuth(err));
      setClave('');
    } finally {
      setCargando(false);
    }
  };

  const olvide = async () => {
    setError(''); setAviso('');
    if (!email.trim()) { setError('Escribe tu correo arriba y vuelve a tocar "Olvidé mi clave".'); return; }
    try {
      await enviarCambioDeClave(email);
      setAviso('Te enviamos un correo para crear una clave nueva. Revisa también la carpeta de spam.');
    } catch (err) {
      setError(mensajeAuth(err));
    }
  };

  return (
    <Marco>
      <form onSubmit={entrar} className="bg-[#111827] rounded-2xl p-6 border border-white/10 shadow-2xl space-y-4">
        <div>
          <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wider">Correo</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com"
            autoComplete="username" required
            className="w-full bg-[#1f2937] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF2B5E] transition" />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wider">Clave</label>
          <input type="password" value={clave} onChange={e => setClave(e.target.value)} placeholder="••••••"
            autoComplete="current-password" required
            className="w-full bg-[#1f2937] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF2B5E] transition" />
        </div>
        {error && <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
        {aviso && <p className="text-green-400 text-xs bg-green-400/10 rounded-lg px-3 py-2">{aviso}</p>}
        <button type="submit" disabled={cargando}
          className="w-full bg-[#FF2B5E] hover:bg-[#e0194a] text-white font-bold py-2.5 rounded-xl transition disabled:opacity-60">
          {cargando ? 'Verificando...' : 'Ingresar'}
        </button>
        <button type="button" onClick={olvide} className="w-full text-gray-400 hover:text-white text-xs transition">
          Olvidé mi clave
        </button>
      </form>
    </Marco>
  );
};

/** La cuenta existe pero aún no tiene perfil, o fue desactivada. */
const SinAcceso = ({ sesion }) => (
  <Marco>
    <div className="bg-[#111827] rounded-2xl p-6 border border-white/10 shadow-2xl space-y-4 text-sm">
      {sesion.estado === 'inactivo' && (
        <p className="text-yellow-400">Tu cuenta está desactivada. Pídele al dueño que la vuelva a activar.</p>
      )}
      {sesion.estado === 'sin-perfil' && (
        <>
          <p className="text-yellow-400">Tu cuenta todavía no tiene un rol asignado.</p>
          <p className="text-gray-400">
            Si eres el dueño y es la primera vez, crea en Firestore el documento
            <span className="text-white"> usuarios_admin/{'{'}tu UID{'}'}</span> con
            <span className="text-white"> rol: &quot;owner&quot;</span> (los pasos están en el README).
          </p>
          <p className="text-gray-400">Tu UID es:</p>
          <p className="font-mono text-xs text-white bg-black/40 rounded-lg px-3 py-2 break-all select-all">{sesion.user?.uid}</p>
        </>
      )}
      {sesion.estado === 'error' && (
        <p className="text-red-400">No se pudo leer tu perfil: {mensajeAuth(sesion.error)}</p>
      )}
      <button onClick={cerrarSesion}
        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 rounded-xl transition">
        Cerrar sesión
      </button>
    </div>
  </Marco>
);

// ─── Sidebar nav ───────────────────────────────────────────────────────────
const NAV = [
  { key: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard, roles: ['owner','admin','ventas','inventario'] },
  { key: 'productos',  label: 'Productos',   icon: Package,         roles: ['owner','admin'] },
  { key: 'inventario', label: 'Inventario',  icon: Warehouse,       roles: ['owner','admin','inventario'] },
  { key: 'ventas',     label: 'Ventas',      icon: ShoppingBag,     roles: ['owner','admin','ventas','inventario'] },
  { key: 'historial',  label: 'Historial',   icon: History,         roles: ['owner','admin','ventas','inventario'] },
  { key: 'pedidosweb', label: 'Pedidos web', icon: MessageCircle,   roles: ['owner','admin','ventas'] },
  { key: 'usuarios',   label: 'Usuarios',    icon: Users,           roles: ['owner','admin'] },
  { key: 'recuerdos',  label: 'Momentos QR', icon: Camera,          roles: ['owner','admin'] },
  { key: 'momentosra', label: 'Momentos RA', icon: Sparkles,        roles: ['owner','admin'] },
];

// ─── Admin principal ───────────────────────────────────────────────────────
const Admin = () => {
  const [sesion, setSesion] = useState({ estado: 'cargando' });
  const [seccion, setSeccion] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => escucharSesion((s) => { setSesion(s); if (s.estado === 'dentro') setSeccion('dashboard'); }), []);

  const usuario = sesion.estado === 'dentro' ? sesion.usuario : null;
  const salir = () => cerrarSesion();
  const nav = usuario ? NAV.filter(n => n.roles.includes(usuario.rol)) : [];
  const irA = (k) => { setSeccion(k); setMenuOpen(false); };

  if (sesion.estado === 'cargando') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-[#FF2B5E] animate-spin" />
      </div>
    );
  }
  if (sesion.estado === 'fuera') return <Login />;
  if (!usuario) return <SinAcceso sesion={sesion} />;

  const SECCIONES = {
    dashboard:  <AdminDashboard usuario={usuario} />,
    productos:  <AdminProductos />,
    inventario: <AdminInventario />,
    ventas:     <AdminVentas usuario={usuario} />,
    historial:  <AdminHistorialVentas />,
    pedidosweb: <AdminPedidosWeb />,
    usuarios:   <AdminUsuarios sesion={usuario} />,
    recuerdos:  <AdminRecuerdos />,
    momentosra: <AdminMomentosRA />,
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
        {(nav.some(n => n.key === seccion) && SECCIONES[seccion]) || SECCIONES.dashboard}
      </main>

    </div>
  );
};

export default Admin;
