// ---------------------------------------------------------------------------
// Datos del negocio y textos para buscadores
//
// Si cambian los distritos, el WhatsApp o la descripción del negocio, este es
// el único archivo que hay que editar.
// ---------------------------------------------------------------------------

export const SITIO = 'https://momentos365.com';
export const NEGOCIO = 'Momentos365';
export const WHATSAPP = '51916098803';
export const CIUDAD = 'Lima';
export const DISTRITOS = ['Miraflores', 'Santa Anita'];

export const DESCRIPCION_BASE =
  `Regalos personalizados en ${CIUDAD}: arreglos de flores, ramos de girasoles, ` +
  `tortas, cuadros y gift boxes. Delivery en ${DISTRITOS.join(', ')} y alrededores. ` +
  `Pide por WhatsApp.`;

export const TITULO_BASE = `${NEGOCIO} | Regalos personalizados y delivery de flores en ${CIUDAD}`;

/** Título y descripción para cada tipo de página. */
export const metaDePagina = ({ vista, categoria, ocasion, producto }) => {
  if (producto) {
    const que = Array.isArray(producto.category) ? producto.category[0] : producto.category;
    return {
      titulo: `${producto.name} | ${NEGOCIO}`,
      descripcion:
        producto.description ||
        `${producto.name}. ${que || 'Regalo personalizado'} con delivery en ${CIUDAD} — ` +
          `${DISTRITOS.join(', ')} y alrededores. Pídelo por WhatsApp en ${NEGOCIO}.`,
      imagen: producto.img || '/images/logo.png',
    };
  }

  const filtro = (categoria && categoria !== 'Todos' && categoria) ||
                 (ocasion && ocasion !== 'Todos' && ocasion) || null;

  if (vista === 'shop' && filtro) {
    return {
      titulo: `${filtro} en ${CIUDAD} | ${NEGOCIO}`,
      descripcion:
        `${filtro} para regalar en ${CIUDAD}. Delivery en ${DISTRITOS.join(', ')} y ` +
        `alrededores, con opciones personalizadas. Mira el catálogo de ${NEGOCIO}.`,
      imagen: '/images/logo.png',
    };
  }

  if (vista === 'shop') {
    return {
      titulo: `Catálogo de regalos en ${CIUDAD} | ${NEGOCIO}`,
      descripcion: DESCRIPCION_BASE,
      imagen: '/images/logo.png',
    };
  }

  return { titulo: TITULO_BASE, descripcion: DESCRIPCION_BASE, imagen: '/images/logo.png' };
};

/** Escribe (o crea) una etiqueta <meta> del documento. */
const ponerMeta = (selector, atributo, valor, contenido) => {
  if (typeof document === 'undefined') return;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(atributo, valor);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', contenido);
};

const ponerCanonica = (url) => {
  if (typeof document === 'undefined') return;
  let tag = document.head.querySelector('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', url);
};

const ponerDatosEstructurados = (json) => {
  if (typeof document === 'undefined') return;
  let tag = document.getElementById('datos-producto');
  if (!json) {
    if (tag) tag.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.id = 'datos-producto';
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(json);
};

const urlAbsoluta = (ruta) => (/^https?:/i.test(ruta) ? ruta : SITIO + encodeURI(ruta));

/**
 * Actualiza título, descripción, vista previa para redes y datos estructurados
 * según lo que se esté viendo.
 */
export const actualizarSeo = ({ vista, categoria, ocasion, producto, ruta }) => {
  const { titulo, descripcion, imagen } = metaDePagina({ vista, categoria, ocasion, producto });
  const url = SITIO + (ruta || '/');

  document.title = titulo;
  ponerMeta('meta[name="description"]', 'name', 'description', descripcion);
  ponerMeta('meta[property="og:title"]', 'property', 'og:title', titulo);
  ponerMeta('meta[property="og:description"]', 'property', 'og:description', descripcion);
  ponerMeta('meta[property="og:image"]', 'property', 'og:image', urlAbsoluta(imagen));
  ponerMeta('meta[property="og:url"]', 'property', 'og:url', url);
  ponerCanonica(url);

  ponerDatosEstructurados(
    producto
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: producto.name,
          image: [urlAbsoluta(producto.img || '/images/logo.png')],
          description: descripcion,
          brand: { '@type': 'Brand', name: NEGOCIO },
          ...(producto.price
            ? {
                offers: {
                  '@type': 'Offer',
                  price: Number(producto.price).toFixed(2),
                  priceCurrency: 'PEN',
                  availability: 'https://schema.org/InStock',
                  url,
                },
              }
            : {}),
        }
      : null
  );
};
