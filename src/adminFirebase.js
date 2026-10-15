// Funciones Firebase para el panel de administración
// Colecciones: usuarios_admin, inventario, ventas

import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── USUARIOS ──────────────────────────────────────────────────────────────
export const subscribeUsuarios = (cb) => {
  const q = query(collection(db, 'usuarios_admin'), orderBy('nombre'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};
export const crearUsuario = (datos) =>
  addDoc(collection(db, 'usuarios_admin'), { ...datos, activo: true, creadoEn: serverTimestamp() });
export const actualizarUsuario = (id, datos) =>
  updateDoc(doc(db, 'usuarios_admin', id), datos);
export const eliminarUsuario = (id) => deleteDoc(doc(db, 'usuarios_admin', id));
export const loginUsuario = (nombre, clave) =>
  new Promise(resolve => {
    const unsub = onSnapshot(query(collection(db, 'usuarios_admin')), snap => {
      unsub();
      const match = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .find(u => u.nombre?.toLowerCase() === nombre.toLowerCase() && u.clave === clave && u.activo !== false);
      resolve(match || null);
    });
  });

// ─── INVENTARIO ────────────────────────────────────────────────────────────
export const subscribeInventario = (cb) => {
  const q = query(collection(db, 'inventario'), orderBy('nombre'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};
export const crearInsumo = (datos) =>
  addDoc(collection(db, 'inventario'), { nombre: '', unidad: 'und', costoUnitario: 0, stock: 0, ...datos, actualizadoEn: serverTimestamp() });
export const actualizarInsumo = (id, datos) =>
  updateDoc(doc(db, 'inventario', id), { ...datos, actualizadoEn: serverTimestamp() });
export const eliminarInsumo = (id) => deleteDoc(doc(db, 'inventario', id));

// ─── VENTAS ────────────────────────────────────────────────────────────────
export const subscribeVentas = (cb) => {
  const q = query(collection(db, 'ventas'), orderBy('fecha', 'desc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};
export const registrarVenta = (datos) =>
  addDoc(collection(db, 'ventas'), { cliente: '', telefono: '', items: [], total: 0, estado: 'pendiente', notas: '', ...datos, fecha: serverTimestamp() });
export const actualizarVenta = (id, datos) => updateDoc(doc(db, 'ventas', id), datos);
export const eliminarVenta = (id) => deleteDoc(doc(db, 'ventas', id));
