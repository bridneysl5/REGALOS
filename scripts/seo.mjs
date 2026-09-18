/**
 * Se ejecuta después de "vite build".
 *
 * 1. Genera dist/sitemap.xml con todas las direcciones de la tienda.
 * 2. Crea una copia del index.html por cada dirección, con su propio título,
 *    descripción e imagen. Así Google y las vistas previas de WhatsApp ven la
 *    información correcta de cada producto sin tener que ejecutar la página.
 *
 * Los productos salen de src/data.js. Los que existan solo en Firebase se
 * siguen viendo en la web, pero no entran al sitemap.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { ALL_PRODUCTS } from '../src/data.js';
import { CATEGORIES, OCCASIONS, slugify, SHOP_SEGMENT } from '../src/routes.js';
import { SITIO, metaDePagina } from '../src/seo.js';

const DIST = 'dist';
const hoy = new Date().toISOString().slice(0, 10);

const escapar = (t) =>
  String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const absoluta = (ruta) => SITIO + encodeURI(ruta);

// --- 1. Lista de páginas -----------------------------------------------------
const paginas = [];

paginas.push({ ruta: '/', prioridad: '1.0', meta: metaDePagina({ vista: 'home' }) });
paginas.push({
  ruta: `/${SHOP_SEGMENT}`,
  prioridad: '0.9',
  meta: metaDePagina({ vista: 'shop' }),
});

CATEGORIES.forEach((c) =>
  paginas.push({
    ruta: `/${slugify(c)}`,
    prioridad: '0.8',
    meta: metaDePagina({ vista: 'shop', categoria: c }),
  })
);

OCCASIONS.forEach((o) =>
  paginas.push({
    ruta: `/${slugify(o)}`,
    prioridad: '0.8',
    meta: metaDePagina({ vista: 'shop', ocasion: o }),
  })
);

ALL_PRODUCTS.forEach((p) => {
  const slug = slugify(p.name);
  const meta = metaDePagina({ producto: p });
  const canonica = `/${SHOP_SEGMENT}/${slug}`;

  paginas.push({ ruta: canonica, prioridad: '0.7', meta, producto: p });

  // Además, la dirección bonita dentro de su ocasión (la que se comparte).
  const ocasion = (Array.isArray(p.occasion) ? p.occasion : [p.occasion]).find(
    (o) => o && o !== 'Todos'
  );
  if (ocasion) {
    paginas.push({
      ruta: `/${slugify(ocasion)}/${slug}`,
      prioridad: '0.6',
      meta,
      producto: p,
      canonica,
    });
  }
});

// --- 2. sitemap.xml ----------------------------------------------------------
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  paginas
    .filter((p) => !p.canonica) // solo direcciones canónicas
    .map(
      (p) =>
        `  <url>\n    <loc>${escapar(absoluta(p.ruta))}</loc>\n` +
        `    <lastmod>${hoy}</lastmod>\n    <priority>${p.prioridad}</priority>\n  </url>`
    )
    .join('\n') +
  `\n</urlset>\n`;

await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8');

// --- 3. Una copia del HTML por página ---------------------------------------
const base = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');

const reemplazar = (html, { meta, ruta, canonica, producto }) => {
  const url = absoluta(canonica || ruta);
  const imagen = /^https?:/i.test(meta.imagen) ? meta.imagen : absoluta(meta.imagen);

  let salida = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapar(meta.titulo)}</title>`)
    .replace(
      /(<meta\s+name="description"\s+content=")[\s\S]*?(")/,
      `$1${escapar(meta.descripcion)}$2`
    )
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${escapar(url)}$2`)
    .replace(
      /(<meta\s+property="og:title"\s+content=")[\s\S]*?(")/,
      `$1${escapar(meta.titulo)}$2`
    )
    .replace(
      /(<meta\s+property="og:description"\s+content=")[\s\S]*?(")/,
      `$1${escapar(meta.descripcion)}$2`
    )
    .replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/, `$1${escapar(imagen)}$2`)
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/, `$1${escapar(url)}$2`);

  if (producto) {
    const datos = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: producto.name,
      image: [imagen],
      description: meta.descripcion,
      brand: { '@type': 'Brand', name: 'Momentos365' },
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
    };
    salida = salida.replace(
      '</head>',
      `  <script type="application/ld+json">${JSON.stringify(datos)}</script>\n  </head>`
    );
  }

  return salida;
};

let creadas = 0;
for (const pagina of paginas) {
  if (pagina.ruta === '/') {
    await fs.writeFile(path.join(DIST, 'index.html'), reemplazar(base, pagina), 'utf8');
  } else {
    const carpeta = path.join(DIST, ...pagina.ruta.split('/').filter(Boolean));
    await fs.mkdir(carpeta, { recursive: true });
    await fs.writeFile(path.join(carpeta, 'index.html'), reemplazar(base, pagina), 'utf8');
  }
  creadas++;
}

console.log(`SEO: ${creadas} páginas con sus etiquetas y sitemap.xml generados.`);
