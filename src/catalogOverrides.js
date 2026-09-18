// ---------------------------------------------------------------------------
// Ediciones del catálogo guardadas en Firebase
//
// El catálogo base vive en src/data.js (código). Lo que se edita en /admin se
// guarda en la colección `catalogoRegalos` de Firestore, un documento por
// producto, usando el id del producto como id del documento.
//
// La tienda lee esa colección y aplica las ediciones encima del catálogo base,
// así que si Firebase no responde la web sigue funcionando con los datos del
// código.
// ---------------------------------------------------------------------------

import { collection, doc, deleteDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { actualizarProducto, normalizarNombre } from './productosFirebase';

export const OVERRIDES_COLLECTION = 'catalogoRegalos';

/**
 * Campos que solo existen en la web. Los productos de Firebase guardan aquí
 * únicamente esto; su nombre, precio, categoría, ocasión y detalles se guardan
 * en el propio producto de Firebase, para que admin-ventas vea lo mismo.
 */
export const CAMPOS_SOLO_WEB = ['isTop', 'isCheap', 'description'];

/** Campos que el admin puede editar y guardar. */
export const CAMPOS_EDITABLES = [
  'name',
  'price',
  'category',
  'occasion',
  'isTop',
  'isCheap',
  'description',
  'details',
];

const comoLista = (valor) => {
  if (Array.isArray(valor)) return valor.filter((v) => String(v).trim() !== '');
  if (valor === undefined || valor === null || valor === '') return [];
  return [valor];
};

/** Normaliza un producto al formato que se guarda en Firestore. */
export const normalizarProducto = (product) => ({
  name: String(product.name || '').trim(),
  price: Number(product.price) || 0,
  category: comoLista(product.category),
  occasion: comoLista(product.occasion),
  isTop: !!product.isTop,
  isCheap: !!product.isCheap,
  description: String(product.description || ''),
  details: comoLista(product.details).map((d) => String(d).trim()),
});

/** Escucha en vivo las ediciones guardadas. Devuelve la función para cancelar. */
export const subscribeOverrides = (onChange, onError) =>
  onSnapshot(
    collection(db, OVERRIDES_COLLECTION),
    (snapshot) => {
      const mapa = {};
      snapshot.forEach((d) => {
        mapa[d.id] = d.data();
      });
      onChange(mapa);
    },
    (error) => {
      console.error('[catalogo] no se pudieron leer las ediciones:', error);
      if (onError) onError(error);
    }
  );

/** Aplica las ediciones guardadas sobre el catálogo base. */
export const applyOverrides = (products, overrides) => {
  if (!overrides || Object.keys(overrides).length === 0) return products;
  return products.map((p) => {
    const ov = overrides[String(p.id)];
    if (!ov) return p;
    const merged = { ...p };
    CAMPOS_EDITABLES.forEach((campo) => {
      if (ov[campo] !== undefined && ov[campo] !== null) merged[campo] = ov[campo];
    });
    return merged;
  });
};

/** Guarda (o actualiza) la edición de un producto en la colección de la web. */
export const saveOverride = (product, campos = CAMPOS_EDITABLES) => {
  const completo = normalizarProducto(product);
  const datos = { updatedAt: serverTimestamp() };
  campos.forEach((campo) => {
    datos[campo] = completo[campo];
  });
  return setDoc(doc(db, OVERRIDES_COLLECTION, String(product.id)), datos, { merge: true });
};

/** Borra una edición guardada. */
export const eliminarOverride = (id) => deleteDoc(doc(db, OVERRIDES_COLLECTION, String(id)));

/**
 * Guarda un producto editado en el admin.
 *
 * - Si viene de Firebase: nombre, precio, categoría, ocasión y detalles se
 *   escriben en el propio producto, así admin-ventas y la web ven lo mismo.
 *   Solo "Top", "Barato" y la descripción quedan aparte, porque admin-ventas
 *   no tiene esos campos.
 * - Si vive solo en el código: se guarda todo aparte, ya que no hay producto
 *   de Firebase que actualizar.
 */
export const guardarProducto = async (product) => {
  if (product?.fuente === 'firebase') {
    await actualizarProducto(product.id, product);
    await saveOverride(product, CAMPOS_SOLO_WEB);
    return;
  }
  await saveOverride(product);
};

/**
 * Ediciones viejas que quedaron sueltas: se guardaron cuando el producto vivía
 * en el código y ahora el producto vive en Firebase con otro identificador.
 * Las emparejamos por nombre para poder recuperarlas.
 */
export const overridesHuerfanos = (overrides = {}, catalogo = []) => {
  const porId = new Set(catalogo.map((p) => String(p.id)));
  const porNombre = new Map();
  catalogo.forEach((p) => {
    if (p.fuente === 'firebase') porNombre.set(normalizarNombre(p.name), p);
  });

  return Object.entries(overrides)
    .filter(([id]) => !porId.has(String(id)))
    .map(([id, datos]) => ({ id, datos, producto: porNombre.get(normalizarNombre(datos.name)) }))
    .filter((h) => h.producto && h.datos.price && h.datos.price !== h.producto.price);
};

/** ¿Cambió algo respecto del producto base? */
export const tieneCambios = (base, editado) => {
  const a = normalizarProducto(base);
  const b = normalizarProducto(editado);
  return JSON.stringify(a) !== JSON.stringify(b);
};

/** Traduce el error de Firebase a algo que se entienda en pantalla. */
export const mensajeDeError = (error) => {
  const code = error?.code || '';
  if (code === 'permission-denied')
    return 'Firebase no permite guardar (reglas de seguridad). Hay que habilitar la escritura en la colección catalogoRegalos.';
  if (code === 'unavailable') return 'Sin conexión con Firebase. Revisa tu internet e intenta de nuevo.';
  return 'No se pudo guardar. Intenta de nuevo.';
};
