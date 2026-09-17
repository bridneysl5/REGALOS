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

import { collection, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const OVERRIDES_COLLECTION = 'catalogoRegalos';

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

/** Guarda (o actualiza) la edición de un producto. */
export const saveOverride = (product) =>
  setDoc(
    doc(db, OVERRIDES_COLLECTION, String(product.id)),
    { ...normalizarProducto(product), updatedAt: serverTimestamp() },
    { merge: true }
  );

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
