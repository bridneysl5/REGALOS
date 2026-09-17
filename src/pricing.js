// ---------------------------------------------------------------------------
// Precios visibles
//
// Por defecto el catálogo NO muestra precios (se cotizan por WhatsApp).
// Sólo los productos de las ocasiones listadas aquí muestran su precio.
// Para activar otra ocasión, basta con agregarla a esta lista.
// ---------------------------------------------------------------------------

export const OCASIONES_CON_PRECIO = ['Flores Amarillas'];

/** ¿Este producto muestra precio al público? */
export const hasPrice = (product) => {
  if (!product || !product.price) return false;
  const occ = product.occasion;
  const lista = Array.isArray(occ) ? occ : [occ];
  return lista.some((o) => OCASIONES_CON_PRECIO.includes(o));
};

/** 119 -> "S/ 119.00" */
export const formatPrice = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

/** Total de las líneas del carrito que sí tienen precio visible. */
export const pricedTotal = (cart = []) =>
  cart.reduce((sum, item) => (hasPrice(item) ? sum + item.price * item.qty : sum), 0);

/** ¿Hay en el carrito algún producto sin precio visible? */
export const hasUnpricedItems = (cart = []) => cart.some((item) => !hasPrice(item));
