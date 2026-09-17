// ---------------------------------------------------------------------------
// Colección `productos` de Firebase (la que administras en admin-ventas)
//
// La web lee de aquí los productos con emprendimiento "Regalos". Este archivo
// traduce entre el formato de Firebase (nombre, precioVenta, imageUrl...) y el
// que usa la tienda (name, price, img...), y permite importar al catálogo de
// Firebase los productos que todavía solo existen en src/data.js.
// ---------------------------------------------------------------------------

import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';

export const PRODUCTOS_COLLECTION = 'productos';
export const EMPRENDIMIENTO = 'Regalos';
export const SITIO = 'https://momentos365.com';

/** Compara nombres ignorando tildes, mayúsculas y espacios de más. */
export const normalizarNombre = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const comoLista = (valor) => {
  if (Array.isArray(valor)) return valor.filter((v) => String(v).trim() !== '');
  if (valor === undefined || valor === null || valor === '') return [];
  return [valor];
};

/** Documento de Firebase -> producto de la tienda. */
export const desdeFirebase = (id, data) => ({
  id,
  name: data.nombre || 'Producto sin nombre',
  price: Number(data.precioVenta) || 0,
  category: data.categoria?.length ? data.categoria : ['Todos'],
  occasion: data.ocasion?.length ? data.ocasion : ['Todos'],
  img: data.imageUrl || '',
  details: data.detalles || [],
});

/** "/images/Flores Amarillas/x.webp" -> "https://momentos365.com/images/Flores%20Amarillas/x.webp" */
export const urlAbsolutaDeImagen = (img) => {
  if (!img) return '';
  if (/^https?:/i.test(img)) return img;
  const ruta = img.startsWith('/') ? img : `/${img}`;
  return SITIO + ruta.split('/').map(encodeURIComponent).join('/');
};

/** Producto de src/data.js -> documento con la misma forma que usa admin-ventas. */
export const haciaFirebase = (product) => ({
  nombre: String(product.name || '').trim(),
  precioVenta: Number(product.price) || 0,
  costoReal: 0,
  costoReceta: 0,
  costoManoObra: 0,
  margen: Number(product.price) || 0,
  receta: [],
  emprendimiento: EMPRENDIMIENTO,
  categoria: comoLista(product.category),
  ocasion: comoLista(product.occasion),
  detalles: comoLista(product.details),
  imageUrl: urlAbsolutaDeImagen(product.img),
});

/** Escucha en vivo los productos de Regalos. Devuelve la función para cancelar. */
export const subscribeProductosRegalos = (onChange, onError) =>
  onSnapshot(
    query(collection(db, PRODUCTOS_COLLECTION), where('emprendimiento', '==', EMPRENDIMIENTO)),
    (snapshot) => {
      const docs = [];
      snapshot.forEach((d) => docs.push(desdeFirebase(d.id, d.data())));
      onChange(docs);
    },
    (error) => {
      console.error('[catalogo] no se pudieron leer los productos:', error);
      if (onError) onError(error);
    }
  );

/** Productos de src/data.js que todavía no existen en Firebase (por nombre). */
export const productosFaltantes = (base = [], enFirebase = []) => {
  const nombres = new Set(enFirebase.map((p) => normalizarNombre(p.name)));
  return base.filter((p) => !nombres.has(normalizarNombre(p.name)));
};

/** Crea el producto en Firebase. */
export const importarProducto = (product) =>
  addDoc(collection(db, PRODUCTOS_COLLECTION), haciaFirebase(product));

/**
 * Catálogo final de la tienda: manda Firebase, y de src/data.js solo se suman
 * los productos que no existen allí. Así nada sale duplicado.
 */
export const mergeCatalogo = (base = [], enFirebase = []) => [
  ...productosFaltantes(base, enFirebase),
  ...enFirebase,
];
