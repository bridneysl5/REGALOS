// ---------------------------------------------------------------------------
// Funciones del catálogo que NO necesitan Firebase.
//
// Viven aparte para que la tienda pueda armar el catálogo sin descargar el
// código de Firebase al abrir la página (eso se carga un momento después).
// productosFirebase.js y catalogOverrides.js las siguen exportando igual, así
// que el admin no cambia nada.
// ---------------------------------------------------------------------------

/** Compara nombres ignorando tildes, mayúsculas y espacios de más. */
export const normalizarNombre = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Productos de src/data.js que todavía no existen en Firebase (por nombre). */
export const productosFaltantes = (base = [], enFirebase = []) => {
  const nombres = new Set(enFirebase.map((p) => normalizarNombre(p.name)));
  return base.filter((p) => !nombres.has(normalizarNombre(p.name)));
};

/**
 * Qué tan completo está un producto, para decidir cuál copia conservar
 * cuando hay dos con el mismo nombre.
 */
const puntaje = (p) =>
  (p.details?.length ? 2 : 0) +
  (String(p.img || '').includes('momentos365.com') ? 1 : 0) +
  (p.price ? 1 : 0);

/** Deja una sola copia por nombre: la más completa. */
export const dedupePorNombre = (productos = []) => {
  const mejor = new Map();
  productos.forEach((p) => {
    const clave = normalizarNombre(p.name);
    const actual = mejor.get(clave);
    if (!actual || puntaje(p) > puntaje(actual)) mejor.set(clave, p);
  });
  return productos.filter((p) => mejor.get(normalizarNombre(p.name)) === p);
};

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

/**
 * Catálogo final de la tienda: manda Firebase (sin copias repetidas), y de
 * src/data.js solo se suman los productos que no existen allí.
 */
export const mergeCatalogo = (base = [], enFirebase = []) => {
  const unicos = dedupePorNombre(enFirebase);
  const soloCodigo = productosFaltantes(base, unicos).map((p) => ({ ...p, fuente: 'codigo' }));
  return [...soloCodigo, ...unicos];
};
