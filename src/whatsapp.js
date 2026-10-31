// ---------------------------------------------------------------------------
// Botones de WhatsApp de la tienda.
//
// Abre el chat con el mensaje armado y, al mismo tiempo, guarda un registro en
// la colección `pedidos_web` para que en el admin (Pedidos web) se vea cuántas
// personas escriben, qué piden y de dónde llegaron.
//
// El registro nunca bloquea al cliente: si Firebase falla, WhatsApp se abre
// igual. Firebase se carga recién al tocar el botón, para no hacer más lenta
// la tienda.
// ---------------------------------------------------------------------------

import { detectarOrigen } from './origen';

export const WHATSAPP_NUMERO = '51916098803';

export const urlWhatsApp = (texto, numero = WHATSAPP_NUMERO) =>
  `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

const registrar = async ({ tipo, items = [], total = 0 }) => {
  const [{ addDoc, collection, serverTimestamp }, { db }] = await Promise.all([
    import('firebase/firestore'),
    import('./firebase'),
  ]);
  await addDoc(collection(db, 'pedidos_web'), {
    tipo,
    items: items.slice(0, 40).map((i) => ({
      id: String(i.id ?? ''),
      nombre: String(i.nombre ?? i.name ?? '').slice(0, 120),
      precio: Number(i.precio ?? i.price) || 0,
      cantidad: Number(i.cantidad ?? i.qty) || 1,
    })),
    total: Number(total) || 0,
    origen: detectarOrigen(),
    pagina: `${window.location.pathname}${window.location.search}`.slice(0, 200),
    estado: 'nuevo',
    creadoEn: serverTimestamp(),
  });
};

/**
 * Abre WhatsApp con `texto`. Si se pasa `registro` ({ tipo, items, total }),
 * también lo guarda en pedidos_web.
 * tipo: 'pedido' (carrito) | 'consulta' (botón flotante) | 'paquete' (paquetes grupales)
 */
export const abrirWhatsApp = (texto, registro) => {
  // Primero se abre la ventana (si se espera a Firebase, el navegador la bloquea).
  window.open(urlWhatsApp(texto), '_blank');
  if (registro) {
    registrar(registro).catch((e) => console.warn('[pedidos_web] no se pudo registrar:', e?.code || e));
  }
};
