// ---------------------------------------------------------------------------
// Inicio de sesión del panel /admin con Firebase Authentication.
//
// Cada persona del equipo entra con su correo y su clave. Las claves las
// guarda Firebase (cifradas); nunca pasan por nuestra base de datos.
//
// El rol de cada persona vive en  usuarios_admin/{uid}:
//   { nombre, email, rol: 'owner' | 'admin' | 'ventas' | 'inventario', activo }
// y las reglas de Firestore (firestore.rules) usan ese documento para decidir
// qué puede leer y escribir cada uno.
// ---------------------------------------------------------------------------

import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, db, firebaseConfig } from './firebase';

export const USUARIOS = 'usuarios_admin';
export const auth = getAuth(app);

/**
 * Escucha la sesión. Llama a `alCambiar` con uno de estos estados:
 *   { estado: 'fuera' }                      -> nadie ha iniciado sesión
 *   { estado: 'dentro', usuario }            -> todo bien
 *   { estado: 'sin-perfil', user }           -> la cuenta existe pero no tiene rol
 *   { estado: 'inactivo', user }             -> el dueño la desactivó
 *   { estado: 'error', user, error }         -> no se pudo leer el perfil
 */
export const escucharSesion = (alCambiar) =>
  onAuthStateChanged(auth, async (user) => {
    if (!user) return alCambiar({ estado: 'fuera' });
    try {
      const ficha = await getDoc(doc(db, USUARIOS, user.uid));
      if (!ficha.exists()) return alCambiar({ estado: 'sin-perfil', user });
      const perfil = ficha.data();
      if (perfil.activo === false) return alCambiar({ estado: 'inactivo', user });
      alCambiar({
        estado: 'dentro',
        usuario: {
          id: user.uid,
          uid: user.uid,
          email: user.email,
          nombre: perfil.nombre || user.email,
          rol: perfil.rol || 'ventas',
        },
      });
    } catch (error) {
      alCambiar({ estado: 'error', user, error });
    }
  });

export const iniciarSesion = (email, clave) =>
  signInWithEmailAndPassword(auth, String(email).trim(), clave);

export const cerrarSesion = () => signOut(auth);

/** Firebase le manda a esa persona un correo para poner una clave nueva. */
export const enviarCambioDeClave = (email) =>
  sendPasswordResetEmail(auth, String(email).trim());

/**
 * Crea la cuenta de alguien del equipo sin cerrar la sesión del dueño.
 * (Firebase inicia sesión con la cuenta nueva al crearla, por eso se hace en
 * una conexión aparte que se descarta al terminar.)
 */
export const crearCuentaEquipo = async ({ email, clave, nombre, rol }) => {
  const aparte = initializeApp(firebaseConfig, `alta-${Date.now()}`);
  try {
    const authAparte = getAuth(aparte);
    const cred = await createUserWithEmailAndPassword(authAparte, String(email).trim(), clave);
    await signOut(authAparte);
    await setDoc(doc(db, USUARIOS, cred.user.uid), {
      nombre: String(nombre).trim(),
      email: String(email).trim().toLowerCase(),
      rol,
      activo: true,
      creadoEn: serverTimestamp(),
    });
    return cred.user.uid;
  } finally {
    await deleteApp(aparte);
  }
};

/** Traduce los errores de Firebase Auth a algo que se entienda. */
export const mensajeAuth = (error) => {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Correo o clave incorrectos';
    case 'auth/invalid-email':
      return 'El correo no es válido';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo';
    case 'auth/weak-password':
      return 'La clave debe tener al menos 6 caracteres';
    case 'auth/operation-not-allowed':
      return 'Falta activar "Correo/contraseña" en Firebase → Authentication → Sign-in method.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Revisa tu internet.';
    case 'permission-denied':
      return 'Firebase no dio permiso (revisa las reglas de Firestore).';
    default:
      return error?.message || 'Ocurrió un error. Intenta de nuevo.';
  }
};
