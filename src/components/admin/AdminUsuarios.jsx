import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { subscribeUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../../adminFirebase';

const ROLES = [
  { value: 'admin',      label: 'Admin',      desc: 'Todo excepto dueño' },
  { value: 'ventas',     label: 'Ventas',     desc: 'Dashboard + Ventas' },
  { value: 'inventario', label: 'Inventario', desc: 'Dashboard + Inventario + Ventas' },
];

const ROL_COLORS = {
  owner:      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  admin:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ventas:     'bg-green-500/20 text-green-400 border-green-500/30',
  inventario: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const emptyForm = { nombre: '', clave: '', rol: 'ventas' };

/* ── Modal ─────────────────────────────────────────────────── */
function ModalUsuario({ usuario, onClose, onGuardar, todos }) {
  const [form, setForm] = useState(usuario ? { nombre: usuario.nombre, clave: usuario.clave, rol: usuario.rol } : { ...emptyForm });
  const [showClave, setShowClave] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    if (!form.clave.trim()) { setError('La clave es obligatoria'); return; }
    if (form.clave.length < 4) { setError('La clave debe tener al menos 4 caracteres'); return; }
    // Verificar nombre duplicado
    const dup = todos.find(u => u.nombre?.toLowerCase() === form.nombre.toLowerCase() && u.id !== usuario?.id);
    if (dup) { setError('Ya existe un usuario con ese nombre'); return; }
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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">{usuario ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>

        <div className="p-5 space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="text-gray-400 text-sm block mb-1">Nombre de usuario *</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                className="w-full bg-gray-800 rounded-lg pl-9 pr-3 py-2 text-white text-sm"
                placeholder="Ej: María, Carlos..." />
            </div>
            <p className="text-gray-500 text-xs mt-1">Con este nombre iniciará sesión</p>
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">Clave de acceso *</label>
            <div className="relative">
              <input type={showClave ? 'text' : 'password'} value={form.clave} onChange={e => set('clave', e.target.value)}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 pr-10 text-white text-sm"
                placeholder="Mínimo 4 caracteres" />
              <button onClick={() => setShowClave(!showClave)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showClave ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-2">Rol</label>
            <div className="space-y-2">
              {ROLES.map(r => (
                <label key={r.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  form.rol === r.value ? 'border-pink-500 bg-pink-500/10' : 'border-gray-700 hover:border-gray-600'
                }`}>
                  <input type="radio" name="rol" value={r.value} checked={form.rol === r.value}
                    onChange={() => set('rol', r.value)} className="accent-pink-500" />
                  <div>
                    <p className="text-white text-sm font-medium">{r.label}</p>
                    <p className="text-gray-400 text-xs">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-700">
          <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
            <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Principal ─────────────────────────────────────────────── */
export default function AdminUsuarios({ sesion }) {
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const unsub = subscribeUsuarios(setUsuarios);
    return unsub;
  }, []);

  const isOwner = sesion?.rol === 'owner';

  const handleGuardar = async (form) => {
    if (modal === 'nuevo') {
      await crearUsuario({ ...form, activo: true });
    } else {
      await actualizarUsuario(modal.id, form);
    }
  };

  const toggleActivo = async (u) => {
    await actualizarUsuario(u.id, { activo: !u.activo });
  };

  const handleEliminar = async (id) => {
    await eliminarUsuario(id);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-xl">Usuarios del admin</h2>
        {isOwner && (
          <button onClick={() => setModal('nuevo')}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
            <Plus size={16} /> Nuevo usuario
          </button>
        )}
      </div>

      {!isOwner && (
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4 text-yellow-400 text-sm">
          Solo el dueño puede crear y gestionar usuarios.
        </div>
      )}

      {/* Info de owner */}
      <div className="bg-gray-800 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck size={20} className="text-yellow-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-yellow-400 text-sm font-semibold">Cuenta dueño</p>
          <p className="text-gray-400 text-xs mt-0.5">Accede con cualquier nombre + la clave maestra del sistema (.env). Tiene acceso total.</p>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {usuarios.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500">
            No hay usuarios creados. {isOwner ? 'Crea el primero.' : ''}
          </div>
        )}
        {usuarios.map(u => (
          <div key={u.id} className={`bg-gray-800 rounded-xl p-4 flex items-center gap-4 ${!u.activo ? 'opacity-50' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {u.nombre?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">{u.nombre}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${ROL_COLORS[u.rol] || ROL_COLORS.ventas}`}>
                  {u.rol}
                </span>
                {!u.activo && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-400 border border-gray-600">inactivo</span>
                )}
              </div>
              <p className="text-gray-500 text-xs mt-0.5">Clave: {'•'.repeat(u.clave?.length || 4)}</p>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle activo */}
                <button onClick={() => toggleActivo(u)} title={u.activo ? 'Desactivar' : 'Activar'}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    u.activo ? 'border-green-600 text-green-400 hover:bg-green-900/20' : 'border-gray-600 text-gray-400 hover:bg-gray-700'
                  }`}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </button>
                <button onClick={() => setModal(u)} className="text-blue-400 hover:text-blue-300 p-1">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => setConfirmDelete(u)} className="text-red-400 hover:text-red-300 p-1">
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <ModalUsuario
          usuario={modal === 'nuevo' ? null : modal}
          todos={usuarios}
          onClose={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}

      {/* Confirmar eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="text-white font-semibold mb-2">¿Eliminar usuario?</p>
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
