// ---------------------------------------------------------------------------
// Colección `productos` de Firebase (la que administras en admin-ventas)
//
// La web lee de aquí los productos con emprendimiento "Regalos". Este archivo
// traduce entre el formato de Firebase (nombre, precioVenta, imageUrl...) y el
// que usa la tienda (name, price, img...), y permite importar al catálogo de
// Firebase los productos que todavía solo existen en src/data.js.
// ---------------------------------------------------------------------------

import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { normalizarNombre, productosFaltantes, dedupePorNombre, mergeCatalogo } from './catalogo';

export { normalizarNombre, productosFaltantes, dedupePorNombre, mergeCatalogo };

export const PRODUCTOS_COLLECTION = 'productos';
export const EMPRENDIMIENTO = 'Regalos';
export const SITIO = 'https://momentos365.com';

const comoLista = (valor) => {
  if (Array.isArray(valor)) return valor.filter((v) => String(v).trim() !== '');
  if (valor === undefined || valor === null || valor === '') return [];
  return [valor];
};

/** Documento de Firebase -> producto de la tienda. */
export const desdeFirebase = (id, data) => ({
  id,
  fuente: 'firebase',
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

/** Crea el producto en Firebase. */
export const importarProducto = (product) =>
  addDoc(collection(db, PRODUCTOS_COLLECTION), haciaFirebase(product));

/** Las copias sobrantes, las que habría que borrar. */
export const duplicados = (productos = []) => {
  const conservar = new Set(dedupePorNombre(productos));
  return productos.filter((p) => !conservar.has(p));
};

/** Borra un producto de Firebase. */
export const eliminarProducto = (id) => deleteDoc(doc(db, PRODUCTOS_COLLECTION, String(id)));

/**
 * Guarda los cambios EN EL PRODUCTO de Firebase (el mismo que ve admin-ventas).
 * Solo toca los campos que ambos sistemas comparten; no pisa costos ni receta.
 */
export const actualizarProducto = (id, product) =>
  updateDoc(doc(db, PRODUCTOS_COLLECTION, String(id)), {
    nombre: String(product.name || '').trim(),
    precioVenta: Number(product.price) || 0,
    categoria: comoLista(product.category),
    ocasion: comoLista(product.occasion),
    detalles: comoLista(product.details),
  });

// ─── CRUD directo desde el panel admin ─────────────────────────────────────

export const crearProductoRegalo = (datos) =>
  addDoc(collection(db, PRODUCTOS_COLLECTION), {
    nombre: datos.nombre || '',
    descripcion: datos.descripcion || '',
    precioVenta: Number(datos.precio) || 0,
    moneda: datos.moneda || 'S/',
    categoria: datos.categoria ? [datos.categoria] : [],
    ocasion: datos.ocasiones || [],
    imageUrl: datos.imagen || '',
    paquete: !!datos.paquete,
    top: !!datos.destacado,
    emprendimiento: EMPRENDIMIENTO,
    costo: datos.costo || null,
  });

export const actualizarProductoRegalo = (id, datos) =>
  updateDoc(doc(db, PRODUCTOS_COLLECTION, String(id)), {
    nombre: datos.nombre,
    descripcion: datos.descripcion || '',
    precioVenta: Number(datos.precio) || 0,
    moneda: datos.moneda || 'S/',
    categoria: datos.categoria ? [datos.categoria] : [],
    ocasion: datos.ocasiones || [],
    imageUrl: datos.imagen || '',
    paquete: !!datos.paquete,
    top: !!datos.destacado,
    ...(datos.costo !== undefined && { costo: datos.costo }),
  });

export const eliminarProductoRegalo = (id) =>
  deleteDoc(doc(db, PRODUCTOS_COLLECTION, String(id)));

/** Escucha productos en formato raw Firebase para el panel admin */
export const subscribeProductosAdmin = (onChange) =>
  onSnapshot(
    query(collection(db, PRODUCTOS_COLLECTION), where('emprendimiento', '==', EMPRENDIMIENTO)),
    (snapshot) => {
      const docs = [];
      snapshot.forEach((d) => {
        const data = d.data();
        docs.push({
          id: d.id,
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          precio: data.precioVenta || 0,
          moneda: data.moneda || 'S/',
          categoria: Array.isArray(data.categoria) ? data.categoria[0] || '' : data.categoria || '',
          ocasiones: data.ocasion || [],
          imagen: data.imageUrl || '',
          paquete: !!data.paquete,
          destacado: !!data.top,
          costo: data.costo || null,
        });
      });
      onChange(docs);
    }
  );
