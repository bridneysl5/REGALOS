import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, User, Mail, ShieldCheck, Eye, EyeOff, KeyRound, AlertTriangle } from 'lucide-react';
import { subscribeUsuarios, actualizarUsuario, eliminarUsuario } from '../../adminFirebase';
import { crearCuentaEquipo, enviarCambioDeClave, mensajeAuth } from '../../adminAuth';

const ROLES = [
  { value: 'admin',      label: 'Admin',      desc: 'Todo excepto gestionar usuarios' },
  { value: 'ventas',     label: 'Ventas',     desc: 'Dashboard + Ventas + Pedidos web' },
  { value: 'inventario', label: 'Inventario', desc: 'Dashboard + Inventario + Ventas' },
];

const ROL_COLORS = {
  owner:      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  admin:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ventas:     'bg-green-500/20 text-green-400 border-green-500/30',
  inventario: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

/** Usuarios del sistema anterior (nombre + clave guardada en la base). Ya no pueden entrar. */
const esAntiguo = (u) => !u.email && 'clave' in u;

/* ── Modal ─────────────────────────────────────────────────── */
function ModalUsuario({ usuario, onClose }) {
  const editando = !!usuario;
  const [form, setForm] = useState(
    editando ? { nombre: usuario.nombre || '', email: usuario.email || '', clave: '', rol: usuario.rol || 'ventas' }
             : { nombre: '', email: '', clave: '', rol: 'ventas' }
  );
  const [showClave, setShowClave] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    setError('');
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    if (!editando) {
      if (!form.email.trim()) { setError('El correo es obligatorio'); return; }
      if (form.clave.length < 6) { setError('La clave debe tener al menos 6 caracteres'); return; }
    }
    setGuardando(true);
    try {
      if (editando) {
        await actualizarUsuario(usuario.id, { nombre: form.nombre.trim(), rol: form.rol });
      } else {
        await crearCuentaEquipo(form);
      }
      onClose();
    } catch (e) {
      setError(mensajeAuth(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">{editando ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>

        <div className="p-5 space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="text-gray-400 text-sm block mb-1">Nombre *</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                className="w-full bg-gray-800 rounded-lg pl-9 pr-3 py-2 text-white text-sm"
                placeholder="Ej: María, Carlos..." />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">Correo *</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} disabled={editando}
                className="w-full bg-gray-800 rounded-lg pl-9 pr-3 py-2 text-white text-sm disabled:opacity-60"
                placeholder="persona@correo.com" />
            </div>
            <p className="text-gray-500 text-xs mt-1">{editando ? 'El correo no se puede cambiar.' : 'Con este correo iniciará sesión.'}</p>
          </div>

          {!editando && (
            <div>
              <label className="text-gray-400 text-sm block mb-1">Clave inicial *</label>
              <div className="relative">
                <input type={showClave ? 'text' : 'password'} value={form.clave} onChange={e => set('clave', e.target.value)}
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 pr-10 text-white text-sm"
                  placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
                <button type="button" onClick={() => setShowClave(!showClave)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showClave ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-1">Luego la persona puede cambiarla con “Olvidé mi clave”.</p>
            </div>
          )}

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
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
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
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');

  useEffect(() => subscribeUsuarios(setUsuarios, (e) => setError(mensajeAuth(e))), []);

  const isOwner = sesion?.rol === 'owner';
  const antiguos = usuarios.filter(esAntiguo);

  const toggleActivo = async (u) => {
    try { await actualizarUsuario(u.id, { activo: u.activo === false }); }
    catch (e) { setError(mensajeAuth(e)); }
  };

  const mandarCambioClave = async (u) => {
    setAviso(''); setError('');
    try {
      await enviarCambioDeClave(u.email);
      setAviso(`Se envió a ${u.email} un correo para cambiar su clave.`);
    } catch (e) { setError(mensajeAuth(e)); }
  };

  const handleEliminar = async (id) => {
    try { await eliminarUsuario(id); }
    catch (e) { setError(mensajeAuth(e)); }
    setConfirmDelete(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
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

      {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
      {aviso && <p className="text-green-400 text-sm bg-green-900/20 rounded-lg px-3 py-2">{aviso}</p>}

      <div className="bg-gray-800 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck size={20} className="text-yellow-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-yellow-400 text-sm font-semibold">Cómo funciona el acceso</p>
          <p className="text-gray-400 text-xs mt-0.5">
            Cada persona entra con su correo y su clave. Las claves las guarda Firebase de forma segura;
            nadie, ni el dueño, puede verlas. Si alguien la olvida, usa “Olvidé mi clave” o el botón de la llave.
          </p>
        </div>
      </div>

      {antiguos.length > 0 && isOwner && (
        <div className="bg-orange-900/20 border border-orange-600/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-orange-400 mt-0.5 shrink-0" />
          <p className="text-orange-300 text-xs">
            Hay {antiguos.length} usuario(s) del sistema anterior (con la clave guardada en la base de datos).
            Ya no pueden entrar. Créalos de nuevo con su correo y luego elimina el usuario antiguo para borrar su clave.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {usuarios.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500">
            No hay usuarios creados. {isOwner ? 'Crea el primero.' : ''}
          </div>
        )}
        {usuarios.map(u => {
          const antiguo = esAntiguo(u);
          const yo = u.id === sesion?.uid;
          return (
            <div key={u.id} className={`bg-gray-800 rounded-xl p-4 flex flex-wrap items-center gap-4 ${u.activo === false || antiguo ? 'opacity-60' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {u.nombre?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-white font-medium">{u.nombre}{yo && <span className="text-gray-500 text-xs"> (tú)</span>}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${ROL_COLORS[u.rol] || ROL_COLORS.ventas}`}>
                    {u.rol}
                  </span>
                  {u.activo === false && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-400 border border-gray-600">inactivo</span>
                  )}
                  {antiguo && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-orange-900/40 text-orange-300 border border-orange-600/40">sistema anterior</span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{u.email || 'Sin correo'}</p>
              </div>
              {isOwner && !yo && (
                <div className="flex items-center gap-2 shrink-0">
                  {!antiguo && (
                    <>
                      <button onClick={() => toggleActivo(u)} title={u.activo === false ? 'Activar' : 'Desactivar'}
                        className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                          u.activo !== false ? 'border-green-600 text-green-400 hover:bg-green-900/20' : 'border-gray-600 text-gray-400 hover:bg-gray-700'
                        }`}>
                        {u.activo !== false ? 'Activo' : 'Inactivo'}
                      </button>
                      <button onClick={() => mandarCambioClave(u)} title="Enviar correo para cambiar la clave" className="text-yellow-400 hover:text-yellow-300 p-1">
                        <KeyRound size={15} />
                      </button>
                      <button onClick={() => setModal(u)} title="Editar" className="text-blue-400 hover:text-blue-300 p-1">
                        <Edit2 size={15} />
                      </button>
                    </>
                  )}
                  <button onClick={() => setConfirmDelete(u)} title="Eliminar" className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <ModalUsuario usuario={modal === 'nuevo' ? null : modal} onClose={() => setModal(null)} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="text-white font-semibold mb-2">¿Eliminar usuario?</p>
            <p className="text-gray-400 text-sm mb-5">
              &quot;{confirmDelete.nombre}&quot; ya no podrá entrar al panel.
              {!esAntiguo(confirmDelete) && ' Su cuenta de correo puedes borrarla también en Firebase → Authentication.'}
            </p>
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
