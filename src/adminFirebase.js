// Funciones Firebase para el panel de administración
// Colecciones: usuarios_admin, inventario, ventas, pedidos_web

import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── USUARIOS ──────────────────────────────────────────────────────────────
// Las cuentas (correo + clave) las maneja Firebase Authentication: ver
// adminAuth.js. Aquí solo está el perfil de cada uno (nombre, rol, activo),
// guardado en usuarios_admin/{uid}.
export const subscribeUsuarios = (cb, onError) => {
  const q = query(collection(db, 'usuarios_admin'), orderBy('nombre'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onError);
};
export const actualizarUsuario = (id, datos) =>
  updateDoc(doc(db, 'usuarios_admin', id), datos);
export const eliminarUsuario = (id) => deleteDoc(doc(db, 'usuarios_admin', id));

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
export const subscribeVentas = (cb, onError) => {
  const q = query(collection(db, 'ventas'), orderBy('creadoEn', 'desc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onError);
};
export const registrarVenta = (datos) =>
  addDoc(collection(db, 'ventas'), { cliente: '', telefono: '', items: [], total: 0, estado: 'pendiente', notas: '', ...datos, creadoEn: new Date(), fecha: serverTimestamp() });
export const actualizarVenta = (id, datos) => updateDoc(doc(db, 'ventas', id), datos);
export const eliminarVenta = (id) => deleteDoc(doc(db, 'ventas', id));

// ─── PEDIDOS WEB ───────────────────────────────────────────────────────────
// Cada vez que alguien toca "Enviar pedido por WhatsApp" (o consulta) en la
// tienda, se guarda un registro aquí. Sirve para saber cuántos clientes
// escriben y cuántos terminan comprando.
export const subscribePedidosWeb = (cb, onError) => {
  const q = query(collection(db, 'pedidos_web'), orderBy('creadoEn', 'desc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onError);
};
export const actualizarPedidoWeb = (id, datos) => updateDoc(doc(db, 'pedidos_web', id), datos);
export const eliminarPedidoWeb = (id) => deleteDoc(doc(db, 'pedidos_web', id));
