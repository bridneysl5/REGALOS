// ---------------------------------------------------------------------------
// Momentos: los álbumes digitales que se abren con un QR.
//
//   /momento/A7K2   ->  el cliente escanea, hace brotar la flor y ve sus fotos
//   /admin          ->  pestaña "Momentos" para crear los pedidos
//
// Todo vive en Firebase (la misma base que ya usas para los productos):
//
//   momentos/{CODIGO}            -> nombre, dedicatoria, canción, estado
//   momentos/{CODIGO}/fotos/1..3 -> cada foto comprimida, guardada como texto
//
// Las fotos se comprimen en el navegador antes de subirlas (máx. ~180 KB cada
// una), así un momento completo pesa menos de medio mega y con el plan gratuito
// de Firebase entran varios miles.
// ---------------------------------------------------------------------------

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

export const MOMENTOS = 'momentos';
export const SITIO = 'https://momentos365.com';
export const MAX_FOTOS = 3;

/** Sin letras ni números que se confundan al dictarlos (0/O, 1/I, 5/S). */
const ALFABETO = 'ACDEFGHJKLMNPQRTUVWXY2346789';

export const generarCodigo = (largo = 4) => {
  let salida = '';
  const azar = new Uint32Array(largo);
  crypto.getRandomValues(azar);
  for (let i = 0; i < largo; i++) salida += ALFABETO[azar[i] % ALFABETO.length];
  return salida;
};

export const normalizarCodigo = (codigo) =>
  String(codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

export const urlDelMomento = (codigo) => `${SITIO}/momento/${normalizarCodigo(codigo)}`;

/** Códigos que ya existen, para no repetir ninguno al generar un lote. */
const codigosOcupados = async () => {
  const snap = await getDocs(collection(db, MOMENTOS));
  const usados = new Set();
  snap.forEach((d) => usados.add(d.id));
  return usados;
};

// --------------------------------------------------------------------------
// Fotos: se achican en el navegador con un canvas antes de guardarlas.
// --------------------------------------------------------------------------

const leerImagen = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });

/**
 * Devuelve la foto como texto (data URL) lista para guardar en Firebase.
 * Baja la calidad de a poco hasta que pese menos de `topeKB`.
 */
export const comprimirFoto = async (file, { ladoMaximo = 1400, topeKB = 180 } = {}) => {
  const img = await leerImagen(file);
  const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
  const ancho = Math.max(1, Math.round(img.width * escala));
  const alto = Math.max(1, Math.round(img.height * escala));

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  ctx.drawImage(img, 0, 0, ancho, alto);

  let calidad = 0.82;
  let texto = lienzo.toDataURL('image/jpeg', calidad);
  while (texto.length / 1.37 > topeKB * 1024 && calidad > 0.35) {
    calidad -= 0.08;
    texto = lienzo.toDataURL('image/jpeg', calidad);
  }
  return texto;
};

export const guardarFotos = async (codigo, archivos, alAvanzar) => {
  const id = normalizarCodigo(codigo);
  const lista = Array.from(archivos).slice(0, MAX_FOTOS);
  for (let i = 0; i < lista.length; i++) {
    const data = await comprimirFoto(lista[i]);
    await setDoc(doc(db, MOMENTOS, id, 'fotos', String(i + 1)), { orden: i + 1, data });
    if (alAvanzar) alAvanzar(i + 1, lista.length);
  }
  await updateDoc(doc(db, MOMENTOS, id), { fotos: lista.length });
  return lista.length;
};

const borrarFotos = async (codigo) => {
  const snap = await getDocs(collection(db, MOMENTOS, normalizarCodigo(codigo), 'fotos'));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
};

// --------------------------------------------------------------------------
// Crear y editar momentos
// --------------------------------------------------------------------------

/** Códigos en blanco para imprimir los QR antes de vender. */
export const crearLote = async (cantidad = 10, nota = '') => {
  const usados = await codigosOcupados();
  const nuevos = [];
  while (nuevos.length < cantidad) {
    const codigo = generarCodigo();
    if (usados.has(codigo)) continue;
    usados.add(codigo);
    nuevos.push(codigo);
  }
  const lote = writeBatch(db);
  nuevos.forEach((codigo) => {
    lote.set(doc(db, MOMENTOS, codigo), {
      codigo,
      estado: 'libre',
      nombre: '',
      dedicatoria: '',
      cancion: '',
      pedido: nota,
      fotos: 0,
      creado: serverTimestamp(),
    });
  });
  await lote.commit();
  return nuevos;
};

/** Crea un momento nuevo ya con sus datos (sin pasar por el lote). */
export const crearMomento = async (datos) => {
  const usados = await codigosOcupados();
  let codigo = normalizarCodigo(datos.codigo);
  if (!codigo || usados.has(codigo)) {
    do { codigo = generarCodigo(); } while (usados.has(codigo));
  }
  await setDoc(doc(db, MOMENTOS, codigo), {
    codigo,
    estado: 'libre',
    nombre: '',
    dedicatoria: '',
    cancion: '',
    pedido: '',
    fotos: 0,
    creado: serverTimestamp(),
  });
  return codigo;
};

/** Llena un código (libre o ya usado) con los datos del pedido. */
export const asignarMomento = async (codigo, { pedido, nombre, dedicatoria, cancion, deParte }) => {
  await updateDoc(doc(db, MOMENTOS, normalizarCodigo(codigo)), {
    pedido: String(pedido || '').trim(),
    nombre: String(nombre || '').trim(),
    dedicatoria: String(dedicatoria || '').trim(),
    deParte: String(deParte || '').trim(),
    cancion: String(cancion || ''),
    estado: 'listo',
    asignado: serverTimestamp(),
  });
};

/** Lo deja como estaba: código impreso, sin contenido. */
export const liberarMomento = async (codigo) => {
  await borrarFotos(codigo);
  await updateDoc(doc(db, MOMENTOS, normalizarCodigo(codigo)), {
    nombre: '', dedicatoria: '', deParte: '', cancion: '', pedido: '',
    estado: 'libre', fotos: 0,
  });
};

export const eliminarMomento = async (codigo) => {
  await borrarFotos(codigo);
  await deleteDoc(doc(db, MOMENTOS, normalizarCodigo(codigo)));
};

/** Lista en vivo para el admin. Devuelve la función para dejar de escuchar. */
export const suscribirMomentos = (alCambiar, alFallar) =>
  onSnapshot(
    query(collection(db, MOMENTOS), orderBy('creado', 'desc')),
    (snap) => {
      const lista = [];
      snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
      alCambiar(lista);
    },
    (error) => {
      console.error('[momentos] no se pudieron leer:', error);
      if (alFallar) alFallar(error);
    }
  );

/** Lo que lee la página pública: los datos y las fotos de un código. */
export const obtenerMomento = async (codigo) => {
  const id = normalizarCodigo(codigo);
  if (!id) return null;
  const ficha = await getDoc(doc(db, MOMENTOS, id));
  if (!ficha.exists()) return null;
  const fotos = await getDocs(collection(db, MOMENTOS, id, 'fotos'));
  const imagenes = fotos.docs
    .map((d) => ({ orden: Number(d.data().orden) || 0, data: d.data().data }))
    .sort((a, b) => a.orden - b.orden)
    .map((f) => f.data);
  return { ...ficha.data(), id, fotos: imagenes };
};
