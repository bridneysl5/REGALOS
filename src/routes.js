// ---------------------------------------------------------------------------
// Rutas amigables para Momentos365
//
//   /                                   -> inicio
//   /catalogo                           -> catálogo sin filtros
//   /arreglos-de-flores                 -> catálogo filtrado por categoría
//   /flores-amarillas                   -> catálogo filtrado por ocasión
//   /flores-amarillas/girasol-eterno-van-gogh   -> producto dentro del filtro
//   /catalogo/girasol-eterno-van-gogh   -> producto sin filtro
//   /admin                              -> panel
//
// Filtros extra (el segundo filtro y la búsqueda) viajan como query:
//   /arreglos-de-flores?ocasion=flores-amarillas&q=girasol
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  'Sets y Gift Boxes',
  'Arreglos de Flores',
  'Cuadros',
  'Tortas y Repostería',
];

export const OCCASIONS = [
  'Cumpleaños',
  'Graduación',
  'Aniversarios y Parejas',
  'Para Ella',
  'Para Él',
  'Nacimientos',
  'Flores Amarillas',
  'Hotwheels',
];

export const SHOP_SEGMENT = 'catalogo';

/** "Tortas y Repostería" -> "tortas-y-reposteria" */
export const slugify = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // quita tildes
    .replace(/[ñÑ]/g, 'n')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildMap = (values) => {
  const map = new Map();
  values.forEach((v) => map.set(slugify(v), v));
  return map;
};

const CATEGORY_BY_SLUG = buildMap(CATEGORIES);
const OCCASION_BY_SLUG = buildMap(OCCASIONS);

export const categoryFromSlug = (slug) => CATEGORY_BY_SLUG.get(slug) || null;
export const occasionFromSlug = (slug) => OCCASION_BY_SLUG.get(slug) || null;

export const productSlug = (product) =>
  product ? slugify(product.name) : '';

/** Busca un producto por slug de nombre o por id. */
export const findProductBySlug = (products, slug) => {
  if (!slug || !Array.isArray(products)) return null;
  const wanted = slugify(slug);
  return (
    products.find((p) => slugify(p.name) === wanted) ||
    products.find((p) => String(p.id).toLowerCase() === String(slug).toLowerCase()) ||
    null
  );
};

/**
 * Construye la URL (path + query) que corresponde al estado actual.
 */
export const buildUrl = ({ view, category, occasion, search, product }) => {
  if (view === 'admin') return '/admin';
  if (view === 'links') return '/links';

  const cat = category && category !== 'Todos' ? category : null;
  const occ = occasion && occasion !== 'Todos' ? occasion : null;
  const productPart = product ? productSlug(product) : '';

  if (view !== 'shop' && !productPart) return '/';

  // El filtro principal ocupa el path; el secundario se va al query.
  const primary = cat || occ;
  const secondary = cat && occ ? occ : null;

  const segments = [];
  segments.push(primary ? slugify(primary) : SHOP_SEGMENT);
  if (productPart) segments.push(productPart);

  const params = new URLSearchParams();
  if (secondary) params.set('ocasion', slugify(secondary));
  if (search && search.trim()) params.set('q', search.trim());

  const qs = params.toString();
  return `/${segments.join('/')}${qs ? `?${qs}` : ''}`;
};

/**
 * Lee una URL (path + query) y devuelve el estado de la app.
 * `productSlugValue` se resuelve luego contra el catálogo (Firebase carga async).
 */
export const parseUrl = (pathname = '/', search = '', allProducts = []) => {
  const params = new URLSearchParams(search);

  const state = {
    view: 'home',
    category: 'Todos',
    occasion: 'Todos',
    search: '',
    productSlug: null,
    legacy: false,
  };

  const segments = String(pathname || '/')
    .split('/')
    .map((s) => decodeURIComponent(s.trim()))
    .filter(Boolean);

  if (segments[0] === 'admin') {
    state.view = 'admin';
    return state;
  }

  if (segments[0] === 'momento') {
    state.view = 'momento';
    return state;
  }
  
  if (segments[0] === 'links' || segments[0] === 'redes') {
    state.view = 'links';
    return state;
  }

  // --- Enlaces antiguos: /?view=shop&category=...&occasion=...&product=... ---
  const hasLegacy =
    params.has('view') || params.has('category') || params.has('occasion') || params.has('product');

  if (segments.length === 0 && hasLegacy) {
    state.legacy = true;
    state.view = params.get('view') === 'shop' || params.has('product') ? 'shop' : 'home';
    state.category = params.get('category') || 'Todos';
    state.occasion = params.get('occasion') || 'Todos';
    state.search = params.get('search') || params.get('q') || '';
    state.productSlug = params.get('product') || null;
    if (state.productSlug) state.view = 'shop';
    return state;
  }

  if (segments.length === 0) {
    state.search = params.get('q') || '';
    return state;
  }

  state.view = 'shop';
  state.search = params.get('q') || '';

  const [first, second] = segments;

  if (first !== SHOP_SEGMENT) {
    const cat = categoryFromSlug(first);
    const occ = occasionFromSlug(first);
    if (cat) state.category = cat;
    else if (occ) state.occasion = occ;
    else if (!second) {
      // Un solo segmento desconocido: lo tratamos como producto suelto.
      state.productSlug = first;
    }
  }

  if (second) state.productSlug = second;

  const occParam = params.get('ocasion') || params.get('occasion');
  if (occParam && state.occasion === 'Todos') {
    const occ = occasionFromSlug(slugify(occParam)) || occasionFromSlug(occParam);
    if (occ) state.occasion = occ;
  }

  const catParam = params.get('categoria');
  if (catParam && state.category === 'Todos') {
    const cat = categoryFromSlug(slugify(catParam));
    if (cat) state.category = cat;
  }

  return state;
};

export const currentUrl = () =>
  `${window.location.pathname}${window.location.search}`;
